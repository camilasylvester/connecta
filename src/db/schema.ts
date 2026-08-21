import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "brand", "creator"]);
export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "approved",
  "rejected",
]);
export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "active",
  "closed",
]);
export const accountStatusEnum = pgEnum("account_status", [
  "pending",
  "approved",
  "rejected",
]);

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(), // Clerk user id
  role: userRoleEnum("role").notNull(),
  accountStatus: accountStatusEnum("account_status")
    .notNull()
    .default("pending"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: text("reviewed_by"),
  displayName: text("display_name"),
  handle: text("handle"),
  tiktokHandle: text("tiktok_handle"),
  tiktokOpenId: text("tiktok_open_id"),
  tiktokAccessToken: text("tiktok_access_token"),
  tiktokRefreshToken: text("tiktok_refresh_token"),
  tiktokTokenExpiresAt: timestamp("tiktok_token_expires_at", {
    withTimezone: true,
  }),
  tiktokConnectedAt: timestamp("tiktok_connected_at", { withTimezone: true }),
  category: text("category"),
  followers: integer("followers").default(0),
  tiktokFollowers: integer("tiktok_followers"),
  city: text("city"),
  province: text("province"),
  age: integer("age"),
  phone: text("phone"),
  brandName: text("brand_name"),
  email: text("email"),
  // Brand onboarding
  industry: text("industry"),
  companyLocation: text("company_location"),
  contactPerson: text("contact_person"),
  contactChannel: text("contact_channel"),
  influencerExperience: text("influencer_experience"),
  goals: jsonb("goals").$type<string[]>().default([]),
  // Creator onboarding
  contentThemes: jsonb("content_themes").$type<string[]>().default([]),
  platforms: jsonb("platforms").$type<string[]>().default([]),
  creatorMeta: jsonb("creator_meta").$type<{
    ubicacion: string | null;
    genero: string | null;
    idiomas: string[];
    categoriaSet: string[];
    redes: Record<string, number>;
  } | null>(),
  avatarUrl: text("avatar_url"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const adminAllowlist = pgTable("admin_allowlist", {
  email: text("email").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  brandId: text("brand_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  eventDate: text("event_date"), // ISO date string YYYY-MM-DD
  quota: integer("quota").notNull().default(50),
  inviteToken: text("invite_token").notNull().unique(),
  status: eventStatusEnum("status").notNull().default("active"),
  category: text("category"),
  profileSought: text("profile_sought"),
  imageUrls: jsonb("image_urls").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    creatorId: text("creator_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: applicationStatusEnum("status").notNull().default("pending"),
    message: text("message"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("applications_event_creator_uidx").on(t.eventId, t.creatorId)]
);

export const postPlatformEnum = pgEnum("post_platform", [
  "instagram",
  "tiktok",
  "youtube",
]);

export const creatorPosts = pgTable("creator_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  creatorId: text("creator_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  platform: postPlatformEnum("platform").notNull(),
  thumbUrl: text("thumb_url"),
  caption: text("caption"),
  brandLabel: text("brand_label"),
  likesCount: integer("likes_count"),
  commentsCount: integer("comments_count"),
  viewsCount: integer("views_count"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type CreatorPost = typeof creatorPosts.$inferSelect;
export type AccountStatus = (typeof accountStatusEnum.enumValues)[number];
export type PostPlatform = (typeof postPlatformEnum.enumValues)[number];
