import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, type Profile } from "@/db/schema";
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

/** Create or refresh profile. Admin is ONLY by authorized email, never via UI. */
export async function ensureProfile(): Promise<Profile | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const db = getDb();
  const user = await currentUser();
  if (!user) return null;

  const emails = emailsFromClerkUser(user);
  const email = emails[0] || null;
  const shouldBeAdmin = isAdminEmailList(emails);

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

    // Keep email in sync
    if (email && existing[0].email !== email) {
      const [synced] = await db
        .update(profiles)
        .set({ email, updatedAt: new Date() })
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

  const [created] = await db
    .insert(profiles)
    .values({
      id: userId,
      role,
      accountStatus: "pending",
      email,
      displayName,
      handle,
      brandName: role === "brand" ? brandName || displayName : null,
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

export async function requireProfile(): Promise<Profile> {
  const profile = await ensureProfile();
  if (!profile) throw new Error("Unauthenticated");
  return profile;
}
