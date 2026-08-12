export type UserRole = "admin" | "brand" | "creator";
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type EventStatus = "draft" | "active" | "closed";

export type { Profile, Event, Application, CreatorPost } from "@/db/schema";

export type ApplicationWithCreator = {
  id: string;
  eventId: string;
  creatorId: string;
  status: ApplicationStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  profiles: {
    displayName: string | null;
    handle: string | null;
    category: string | null;
    followers: number | null;
    city: string | null;
  } | null;
};
