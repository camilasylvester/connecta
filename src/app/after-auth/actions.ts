"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { ensureProfile, requireUserId } from "@/lib/auth";
import { normalizeInstagramHandle } from "@/lib/instagram";
import {
  type OnboardingPayload,
  validateOnboarding,
} from "@/lib/onboarding";
import { payloadToCreatorMeta } from "@/lib/creator-registro-v3";

/** Save full onboarding questionnaire into the profile. */
export async function syncOnboarding(raw: OnboardingPayload) {
  const userId = await requireUserId();
  const check = validateOnboarding(raw);
  if (!check.ok) return { ok: false as const, error: check.error };

  await ensureProfile();

  const db = getDb();
  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!existing[0]) return { ok: false as const, error: "Perfil no encontrado" };

  // Don't overwrite admin role from form
  const role =
    existing[0].role === "admin" ? ("admin" as const) : raw.role;

  const handle = normalizeInstagramHandle(raw.instagram);
  const ageNum = raw.age ? Number(raw.age) : null;

  await db
    .update(profiles)
    .set({
      role,
      displayName: raw.fullName.trim(),
      handle,
      tiktokHandle: raw.tiktok.trim() || null,
      province: raw.province || null,
      city:
        raw.role === "brand"
          ? raw.companyLocation.trim() || raw.province || null
          : raw.province || null,
      age: ageNum && Number.isFinite(ageNum) ? ageNum : null,
      phone: raw.phone.trim() || null,
      email: raw.contactEmail.trim().toLowerCase() || existing[0].email,
      followers:
        Number(String(raw.followers || "").replace(/\D/g, "")) || 0,
      tiktokFollowers:
        Number(String(raw.tiktokFollowers || "").replace(/\D/g, "")) || null,
      brandName:
        raw.role === "brand" ? raw.brandName.trim() || null : existing[0].brandName,
      industry: raw.role === "brand" ? raw.industry || null : null,
      category:
        raw.role === "brand"
          ? raw.industry || null
          : raw.contentThemes[0] || null,
      companyLocation:
        raw.role === "brand" ? raw.companyLocation.trim() || null : null,
      contactPerson:
        raw.role === "brand" ? raw.contactPerson.trim() || null : null,
      contactChannel:
        raw.role === "brand" ? raw.contactChannel.trim() || null : null,
      influencerExperience:
        raw.role === "brand" ? raw.influencerExperience || null : null,
      goals: raw.role === "brand" ? raw.goals : [],
      contentThemes: raw.role === "creator" ? raw.contentThemes : [],
      platforms: raw.role === "creator" ? raw.platforms : [],
      creatorMeta:
        raw.role === "creator" ? payloadToCreatorMeta(raw) : existing[0].creatorMeta,
      onboardingCompleted: true,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId));

  return { ok: true as const };
}
