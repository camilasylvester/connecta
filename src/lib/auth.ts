import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { adminAllowlist, profiles, type Profile } from "@/db/schema";
import { isAdminEmailList } from "@/lib/admin-emails";
import type { UserRole } from "@/lib/types";

export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");
  return userId;
}

function resolveSignupRole(requested: string | undefined): UserRole {
  if (requested === "brand") return "brand";
  return "creator";
}

function emailsFromClerkUser(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  const list = [
    user.primaryEmailAddress?.emailAddress,
    ...user.emailAddresses.map((e) => e.emailAddress),
  ].filter(Boolean) as string[];
  return [...new Set(list)];
}

/** Create or refresh profile. Admin is by allowlisted email, never via UI. */
export async function ensureProfile(): Promise<Profile | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const db = getDb();
  const user = await currentUser();
  if (!user) return null;

  const emails = emailsFromClerkUser(user);
  const email = emails[0] || null;
  const allowlisted = await db.select({ email: adminAllowlist.email }).from(adminAllowlist);
  const shouldBeAdmin = isAdminEmailList(
    emails,
    allowlisted.map((row) => row.email)
  );

  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  // Authorized emails always become / stay admin (always approved)
  if (shouldBeAdmin) {
    if (existing[0]) {
      if (
        existing[0].role !== "admin" ||
        existing[0].email !== email ||
        existing[0].accountStatus !== "approved"
      ) {
        const [updated] = await db
          .update(profiles)
          .set({
            role: "admin",
            accountStatus: "approved",
            email,
            displayName:
              existing[0].displayName || user.firstName || "Admin",
            updatedAt: new Date(),
          })
          .where(eq(profiles.id, userId))
          .returning();
        return updated;
      }
      return existing[0];
    }

    const [created] = await db
      .insert(profiles)
      .values({
        id: userId,
        role: "admin",
        accountStatus: "approved",
        email,
        displayName:
          user.fullName || user.firstName || email?.split("@")[0] || "Admin",
      })
      .onConflictDoNothing({ target: profiles.id })
      .returning();

    if (created) return created;
    const again = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    return again[0] || null;
  }

  if (existing[0]) {
    // Never keep admin if email is not authorized
    if (existing[0].role === "admin") {
      const meta = user.unsafeMetadata || {};
      const fallback =
        typeof meta.role === "string" && meta.role === "brand"
          ? "brand"
          : "creator";
      const [demoted] = await db
        .update(profiles)
        .set({ role: fallback, email, updatedAt: new Date() })
        .where(eq(profiles.id, userId))
        .returning();
      return demoted;
    }

    const meta = user.unsafeMetadata || {};
    const termsAccepted =
      meta.terms_accepted === "true" || meta.terms_accepted === true;
    const { TERMS_VERSION } = await import("@/lib/terms");
    const termsVersion =
      typeof meta.terms_version === "string" && meta.terms_version.trim()
        ? meta.terms_version.trim()
        : TERMS_VERSION;

    const patch: Partial<typeof profiles.$inferInsert> = {};
    if (email && existing[0].email !== email) patch.email = email;
    if (!existing[0].phone && typeof meta.phone === "string" && meta.phone) {
      const { formatMobileDisplay, isValidMobile } = await import(
        "@/lib/phone"
      );
      if (isValidMobile(meta.phone)) {
        patch.phone = formatMobileDisplay(meta.phone) || meta.phone.trim();
      }
    }
    if (!existing[0].termsAcceptedAt && termsAccepted) {
      patch.termsAcceptedAt = new Date();
      patch.termsVersion = termsVersion;
    }

    if (Object.keys(patch).length > 0) {
      const [synced] = await db
        .update(profiles)
        .set({ ...patch, updatedAt: new Date() })
        .where(eq(profiles.id, userId))
        .returning();
      return synced;
    }
    return existing[0];
  }

  const meta = user.unsafeMetadata || {};
  const requested = typeof meta.role === "string" ? meta.role : "creator";
  const role = resolveSignupRole(requested);
  const brandName =
    typeof meta.brand_name === "string" ? meta.brand_name : null;
  const { normalizeInstagramHandle } = await import("@/lib/instagram");
  const { TERMS_VERSION } = await import("@/lib/terms");
  const handle =
    typeof meta.handle === "string"
      ? normalizeInstagramHandle(meta.handle)
      : null;
  const displayName =
    typeof meta.display_name === "string"
      ? meta.display_name
      : brandName ||
        handle ||
        user.fullName ||
        user.firstName ||
        email?.split("@")[0] ||
        "Usuario";

  const termsAccepted =
    meta.terms_accepted === "true" || meta.terms_accepted === true;
  const termsVersion =
    typeof meta.terms_version === "string" && meta.terms_version.trim()
      ? meta.terms_version.trim()
      : TERMS_VERSION;

  // La ficha se completa antes de crear el acceso y su contacto (nombre,
  // celular, Instagram/marca, terminos) llega por unsafeMetadata, tanto en el
  // alta con email como en la de Google. La ficha entera la sube despues
  // /completar-perfil desde el borrador local (ver src/lib/signup-draft.ts).
  const { formatMobileDisplay, isValidMobile } = await import("@/lib/phone");
  const rawPhone = typeof meta.phone === "string" ? meta.phone : "";
  const phone =
    rawPhone && isValidMobile(rawPhone)
      ? formatMobileDisplay(rawPhone) || rawPhone.trim()
      : null;

  const [created] = await db
    .insert(profiles)
    .values({
      id: userId,
      role,
      accountStatus: "pending",
      email,
      displayName,
      handle,
      phone,
      brandName: role === "brand" ? brandName || displayName : null,
      contactPerson:
        role === "brand" && typeof meta.contact_name === "string"
          ? meta.contact_name.trim() || null
          : null,
      ...(termsAccepted
        ? {
            termsAcceptedAt: new Date(),
            termsVersion,
          }
        : {}),
    })
    .onConflictDoNothing({ target: profiles.id })
    .returning();

  if (created) return created;

  const again = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  // Backfill terms from Clerk metadata if the profile was created without them.
  const row = again[0];
  if (row && !row.termsAcceptedAt && termsAccepted) {
    const [updated] = await db
      .update(profiles)
      .set({
        termsAcceptedAt: new Date(),
        termsVersion,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning();
    return updated || row;
  }

  return row || null;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await ensureProfile();
  if (!profile) throw new Error("Unauthenticated");
  return profile;
}
