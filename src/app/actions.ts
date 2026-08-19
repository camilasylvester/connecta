"use server";

import { randomBytes } from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { applications, creatorPosts, events, profiles } from "@/db/schema";
import { requireProfile, requireUserId } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/types";
import {
  type OnboardingPayload,
  validateOnboarding,
} from "@/lib/onboarding";
import { payloadToCreatorMeta } from "@/lib/creator-registro-v3";
import { isAllowedStoredImageUrl, parseImageUrlsField } from "@/lib/image-compress";
import {
  detectPostPlatform,
  resolvePostThumb,
} from "@/lib/posts";

export async function createEvent(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "brand" && profile.role !== "admin") {
    throw new Error("Solo marcas o admin pueden crear eventos");
  }
  if (profile.role !== "admin" && profile.accountStatus !== "approved") {
    throw new Error("Tu cuenta aún no está aprobada");
  }

  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("El título es obligatorio");

  const db = getDb();
  let brandId = profile.id;

  if (profile.role === "admin") {
    const requestedBrand = String(formData.get("brand_id") || "").trim();
    if (!requestedBrand) {
      throw new Error("Elegí la marca dueña del evento");
    }
    const brand = await db
      .select({ id: profiles.id, role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, requestedBrand))
      .limit(1);
    if (!brand[0] || brand[0].role !== "brand") {
      throw new Error("Marca inválida");
    }
    brandId = brand[0].id;
  }

  const inviteToken = randomBytes(16).toString("hex");
  const imageUrls = parseImageUrlsField(formData.get("image_urls"));

  // Brands wait for admin approval; admins publish immediately.
  const status = profile.role === "admin" ? "active" : "draft";

  const [row] = await db
    .insert(events)
    .values({
      brandId,
      title,
      description: String(formData.get("description") || "").trim() || null,
      location: String(formData.get("location") || "").trim() || null,
      eventDate: String(formData.get("event_date") || "").trim() || null,
      quota: Number(formData.get("quota") || 50) || 50,
      category: String(formData.get("category") || "").trim() || null,
      profileSought: String(formData.get("profile_sought") || "").trim() || null,
      imageUrls,
      inviteToken,
      status,
    })
    .returning({ id: events.id });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/eventos");
  revalidatePath("/eventos");
  revalidatePath("/admin");
  revalidatePath("/admin/eventos");
  redirect(`/dashboard/eventos/${row.id}`);
}

export async function updateEvent(eventId: string, formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "brand" && profile.role !== "admin") {
    throw new Error("No autorizado");
  }

  const db = getDb();
  const existing = await db
    .select({ id: events.id, brandId: events.brandId, status: events.status })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  const ev = existing[0];
  if (!ev) throw new Error("Evento no encontrado");
  if (profile.role === "brand" && ev.brandId !== profile.id) {
    throw new Error("No autorizado");
  }

  let nextStatus = String(formData.get("status") || ev.status) as
    | "draft"
    | "active"
    | "closed";

  // Brands cannot self-approve: only admin can set active.
  if (profile.role === "brand") {
    if (nextStatus === "active") {
      nextStatus = ev.status === "active" ? "active" : "draft";
    } else if (nextStatus !== "closed") {
      nextStatus = "draft";
    }
  }

  const patch: Record<string, unknown> = {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim() || null,
    location: String(formData.get("location") || "").trim() || null,
    eventDate: String(formData.get("event_date") || "").trim() || null,
    quota: Number(formData.get("quota") || 50) || 50,
    category: String(formData.get("category") || "").trim() || null,
    profileSought: String(formData.get("profile_sought") || "").trim() || null,
    status: nextStatus,
    updatedAt: new Date(),
  };

  if (formData.has("image_urls")) {
    patch.imageUrls = parseImageUrlsField(formData.get("image_urls"));
  }

  if (profile.role === "admin") {
    await db.update(events).set(patch).where(eq(events.id, eventId));
  } else {
    await db
      .update(events)
      .set(patch)
      .where(and(eq(events.id, eventId), eq(events.brandId, profile.id)));
  }

  revalidatePath(`/dashboard/eventos/${eventId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/eventos");
  revalidatePath("/eventos");
  revalidatePath("/admin");
  revalidatePath("/admin/eventos");
  redirect(`/dashboard/eventos/${eventId}`);
}

/** Admin-only: approve a draft event so it goes live. */
export async function adminApproveEvent(eventId: string) {
  const profile = await requireProfile();
  if (profile.role !== "admin") {
    throw new Error("Solo admins pueden aprobar eventos");
  }
  if (!eventId) throw new Error("Evento inválido");

  const db = getDb();
  await db
    .update(events)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(events.id, eventId));

  revalidatePath(`/dashboard/eventos/${eventId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/eventos");
  revalidatePath("/eventos");
  revalidatePath("/admin");
  revalidatePath("/admin/eventos");
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  eventId: string
) {
  const profile = await requireProfile();
  if (profile.role !== "brand" && profile.role !== "admin") {
    throw new Error("No autorizado");
  }

  const db = getDb();

  if (profile.role === "brand") {
    const owned = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.brandId, profile.id)))
      .limit(1);
    if (!owned[0]) throw new Error("Evento no encontrado");
  }

  await db
    .update(applications)
    .set({ status, updatedAt: new Date() })
    .where(eq(applications.id, applicationId));

  revalidatePath(`/dashboard/eventos/${eventId}`);
  revalidatePath(`/dashboard/eventos/${eventId}/solicitudes`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/creadores");
  revalidatePath("/admin/postulaciones");
}

export async function updateBrandProfile(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "brand" && profile.role !== "admin") {
    throw new Error("Solo marcas pueden editar este perfil");
  }

  const brandName = String(formData.get("brand_name") || "").trim() || null;
  const displayName =
    String(formData.get("display_name") || "").trim() || brandName;

  const db = getDb();
  await db
    .update(profiles)
    .set({
      brandName,
      displayName,
      category: String(formData.get("category") || "").trim() || null,
      city: String(formData.get("city") || "").trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profile.id));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/config");
  revalidatePath("/dashboard/eventos");
}

export async function updateCreatorProfile(formData: FormData) {
  const userId = await requireUserId();
  const { normalizeInstagramHandle } = await import("@/lib/instagram");
  const handle = normalizeInstagramHandle(
    String(formData.get("handle") || "")
  );
  if (!handle) throw new Error("Tu Instagram es obligatorio");

  const db = getDb();
  await db
    .update(profiles)
    .set({
      handle,
      category: String(formData.get("category") || "").trim() || null,
      city: String(formData.get("city") || "").trim() || null,
      followers: Number(formData.get("followers") || 0) || 0,
      displayName:
        String(formData.get("display_name") || "").trim() || handle || null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId));
}

export async function applyToEvent(eventId: string, formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "creator") {
    throw new Error("Solo influencers pueden postularse");
  }
  if (profile.accountStatus === "rejected") {
    throw new Error("Tu cuenta fue rechazada");
  }

  const db = getDb();
  const [event] = await db
    .select({ status: events.status })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!event || event.status !== "active") {
    throw new Error("Este evento no está abierto a postulaciones");
  }

  const incomingHandle = String(formData.get("handle") || "").trim();
  if (incomingHandle || !profile.handle) {
    await updateCreatorProfile(formData);
  }

  try {
    await db.insert(applications).values({
      eventId,
      creatorId: profile.id,
      message: String(formData.get("message") || "").trim() || null,
      status: "pending",
    });
  } catch {
    redirect("/mis-postulaciones");
  }

  revalidatePath("/mis-postulaciones");
  redirect("/mis-postulaciones");
}

/** Logged-in user updates their own ficha (brand or creator). Role cannot change. */
async function applyProfilePayload(
  target: typeof profiles.$inferSelect,
  formRole: "brand" | "creator",
  raw: OnboardingPayload
) {
  const effective: OnboardingPayload = {
    ...raw,
    role: formRole,
  };

  const check = validateOnboarding(effective);
  if (!check.ok) throw new Error(check.error);

  const { normalizeInstagramHandle } = await import("@/lib/instagram");
  const handle = normalizeInstagramHandle(effective.instagram);
  const ageNum = effective.age ? Number(effective.age) : null;
  const igFollowers = Number(String(effective.followers || "").replace(/\D/g, ""));
  const ttFollowers = Number(
    String(effective.tiktokFollowers || "").replace(/\D/g, "")
  );

  const db = getDb();
  await db
    .update(profiles)
    .set({
      displayName: effective.fullName.trim(),
      handle,
      tiktokHandle: effective.tiktok.trim() || null,
      province: effective.province || null,
      city:
        formRole === "brand"
          ? effective.companyLocation.trim() || effective.province || null
          : effective.province || null,
      age: ageNum && Number.isFinite(ageNum) ? ageNum : null,
      phone: effective.phone.trim() || null,
      email: effective.contactEmail.trim().toLowerCase() || target.email,
      brandName:
        formRole === "brand"
          ? effective.brandName.trim() || null
          : target.brandName,
      industry: formRole === "brand" ? effective.industry || null : target.industry,
      category:
        formRole === "brand"
          ? effective.industry || null
          : effective.contentThemes[0] || null,
      companyLocation:
        formRole === "brand" ? effective.companyLocation.trim() || null : null,
      contactPerson:
        formRole === "brand" ? effective.contactPerson.trim() || null : null,
      contactChannel:
        formRole === "brand" ? effective.contactChannel.trim() || null : null,
      influencerExperience:
        formRole === "brand" ? effective.influencerExperience || null : null,
      goals: formRole === "brand" ? effective.goals : target.goals || [],
      contentThemes:
        formRole === "creator" ? effective.contentThemes : target.contentThemes || [],
      platforms:
        formRole === "creator" ? effective.platforms : target.platforms || [],
      avatarUrl:
        formRole === "creator"
          ? (() => {
              const raw = effective.avatarUrl?.trim() || "";
              if (!raw) return null;
              if (!isAllowedStoredImageUrl(raw)) {
                throw new Error("URL de avatar inválida");
              }
              return raw;
            })()
          : target.avatarUrl,
      followers:
        formRole === "creator"
          ? Number.isFinite(igFollowers)
            ? igFollowers
            : 0
          : target.followers,
      tiktokFollowers:
        formRole === "creator"
          ? Number.isFinite(ttFollowers) && ttFollowers > 0
            ? ttFollowers
            : null
          : target.tiktokFollowers,
      creatorMeta:
        formRole === "creator" ? payloadToCreatorMeta(effective) : target.creatorMeta,
      onboardingCompleted: true,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, target.id));
}

export async function updateSelfProfile(raw: OnboardingPayload) {
  const profile = await requireProfile();
  if (profile.role !== "brand" && profile.role !== "creator" && profile.role !== "admin") {
    throw new Error("No autorizado");
  }

  const formRole: "brand" | "creator" =
    profile.role === "brand" ? "brand" : "creator";

  await applyProfilePayload(profile, formRole, raw);

  revalidatePath("/mi-perfil");
  revalidatePath("/dashboard/config");
  revalidatePath("/mis-postulaciones");
  revalidatePath("/eventos");
  revalidatePath("/admin/usuarios");
  revalidatePath("/dashboard/explorar");
  return { ok: true as const };
}

/** Admin-only: edit any brand or creator profile. */
export async function adminUpdateProfile(
  profileId: string,
  raw: OnboardingPayload
) {
  const me = await requireProfile();
  if (me.role !== "admin") {
    throw new Error("Solo admins pueden editar otros perfiles");
  }
  if (!profileId) throw new Error("ID inválido");

  const db = getDb();
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);
  const target = rows[0];
  if (!target) throw new Error("Usuario no encontrado");
  if (target.role !== "brand" && target.role !== "creator") {
    throw new Error("Solo se pueden editar marcas y creadores");
  }

  await applyProfilePayload(target, target.role, raw);

  revalidatePath(`/admin/usuarios/${profileId}`);
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/solicitudes");
  revalidatePath("/mi-perfil");
  revalidatePath("/dashboard/config");
  revalidatePath("/eventos");
  revalidatePath("/dashboard/creadores");
  revalidatePath("/dashboard/explorar");
  return { ok: true as const };
}

/** Admin-only: permanently delete a profile and related rows. */
export async function adminDeleteProfile(profileId: string) {
  const profile = await requireProfile();
  if (profile.role !== "admin") {
    throw new Error("Solo admins pueden borrar registros");
  }
  if (!profileId) throw new Error("ID inválido");
  if (profileId === profile.id) {
    throw new Error("No podés borrar tu propia cuenta de admin");
  }

  const db = getDb();
  const existing = await db
    .select({ id: profiles.id, role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (!existing[0]) throw new Error("Registro no encontrado");

  // Cascade: applications (as creator) + events (as brand) + applications on those events
  if (existing[0].role === "brand") {
    const brandEvents = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.brandId, profileId));
    const eventIds = brandEvents.map((e) => e.id);
    if (eventIds.length > 0) {
      await db
        .delete(applications)
        .where(inArray(applications.eventId, eventIds));
      await db.delete(events).where(eq(events.brandId, profileId));
    }
  }

  await db.delete(applications).where(eq(applications.creatorId, profileId));
  await db.delete(profiles).where(eq(profiles.id, profileId));

  // Best-effort: remove Clerk user when it's a real Clerk id
  if (profileId.startsWith("user_")) {
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      await client.users.deleteUser(profileId);
    } catch {
      // Demo / already-deleted Clerk users are fine
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/postulaciones");
  revalidatePath("/admin/eventos");
  revalidatePath("/eventos");
  revalidatePath("/dashboard");
  redirect("/admin/usuarios");
}

/** Brand (own events) or admin: delete an event and its applications. */
export async function deleteEvent(eventId: string) {
  const profile = await requireProfile();
  if (profile.role !== "admin" && profile.role !== "brand") {
    throw new Error("No autorizado");
  }

  const db = getDb();
  const existing = await db
    .select({ id: events.id, brandId: events.brandId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  const ev = existing[0];
  if (!ev) throw new Error("Evento no encontrado");
  if (profile.role === "brand" && ev.brandId !== profile.id) {
    throw new Error("Solo podés borrar tus propios eventos");
  }

  await db.delete(applications).where(eq(applications.eventId, eventId));
  await db.delete(events).where(eq(events.id, eventId));

  revalidatePath("/admin");
  revalidatePath("/admin/eventos");
  revalidatePath("/admin/postulaciones");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/eventos");
  revalidatePath("/eventos");

  redirect(profile.role === "admin" ? "/admin/eventos" : "/dashboard/eventos");
}

/** Admin-only: approve or reject a brand/creator signup. */
export async function adminSetAccountStatus(
  profileId: string,
  status: "approved" | "rejected"
) {
  const profile = await requireProfile();
  if (profile.role !== "admin") {
    throw new Error("Solo admins pueden revisar solicitudes");
  }
  if (!profileId) throw new Error("ID inválido");
  if (profileId === profile.id) {
    throw new Error("No podés cambiar el estado de tu propia cuenta");
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  const target = existing[0];
  if (!target) throw new Error("Registro no encontrado");
  if (target.role === "admin") {
    throw new Error("No se puede cambiar el estado de un admin");
  }
  if (status === "approved" && !target.onboardingCompleted) {
    throw new Error("La ficha está incompleta. No se puede aceptar todavía.");
  }

  const [updated] = await db
    .update(profiles)
    .set({
      accountStatus: status,
      reviewedAt: new Date(),
      reviewedBy: profile.id,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profileId))
    .returning();

  if (status === "approved" && updated) {
    const { sendWelcomeEmail } = await import("@/lib/welcome-email");
    await sendWelcomeEmail(updated);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/solicitudes");
  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${profileId}`);
  revalidatePath("/pendiente");
  revalidatePath("/rechazado");
}

/** Resolve platform + thumb for the add-post form (server-side TikTok oEmbed). */
export async function previewCreatorPostUrl(url: string) {
  await requireUserId();
  const trimmed = String(url || "").trim();
  const platform = detectPostPlatform(trimmed);
  if (!platform) {
    return { ok: false as const, error: "Link no reconocido" };
  }
  const thumbUrl = await resolvePostThumb(trimmed, platform, null);
  return { ok: true as const, platform, thumbUrl };
}

/** Creator: add a portfolio post by pasting a public URL. */
export async function createCreatorPost(input: {
  url: string;
  caption: string;
  brandLabel?: string;
  thumbUrl?: string;
  likesCount?: string | number;
  commentsCount?: string | number;
  viewsCount?: string | number;
}) {
  const profile = await requireProfile();
  if (profile.role !== "creator" && profile.role !== "admin") {
    throw new Error("Solo creadores pueden publicar en el feed");
  }
  if (profile.role !== "admin" && profile.accountStatus !== "approved") {
    throw new Error("Tu cuenta aún no está aprobada");
  }

  const url = String(input.url || "").trim();
  const caption = String(input.caption || "").trim();
  if (!url) throw new Error("Pegá el link de la publicación");
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("El link debe empezar con https://");
  }
  if (!caption) throw new Error("Escribí un copy / descripción");

  const platform = detectPostPlatform(url);
  if (!platform) {
    throw new Error("Usá un link de Instagram, TikTok o YouTube");
  }

  function parseCount(raw: string | number | undefined): number | null {
    if (raw === undefined || raw === null || raw === "") return null;
    const n = Number(String(raw).replace(/\D/g, ""));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  const thumbUrl = await resolvePostThumb(url, platform, input.thumbUrl);
  const db = getDb();
  const [row] = await db
    .insert(creatorPosts)
    .values({
      creatorId: profile.id,
      url,
      platform,
      thumbUrl,
      caption,
      brandLabel: String(input.brandLabel || "").trim() || null,
      likesCount: parseCount(input.likesCount),
      commentsCount: parseCount(input.commentsCount),
      viewsCount: parseCount(input.viewsCount),
    })
    .returning();

  revalidatePath("/mi-perfil");
  revalidatePath("/dashboard/creadores");
  revalidatePath("/admin/usuarios");
  return { ok: true as const, post: row };
}

/** Creator: remove one of their posts. */
export async function deleteCreatorPost(postId: string) {
  const profile = await requireProfile();
  if (profile.role !== "creator" && profile.role !== "admin") {
    throw new Error("No autorizado");
  }

  const db = getDb();
  if (profile.role === "admin") {
    await db.delete(creatorPosts).where(eq(creatorPosts.id, postId));
  } else {
    await db
      .delete(creatorPosts)
      .where(
        and(eq(creatorPosts.id, postId), eq(creatorPosts.creatorId, profile.id))
      );
  }

  revalidatePath("/mi-perfil");
  revalidatePath("/dashboard/creadores");
  revalidatePath("/admin/usuarios");
  return { ok: true as const };
}
