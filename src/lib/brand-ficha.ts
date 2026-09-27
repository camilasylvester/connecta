import type { BrandFichaModel } from "@/components/BrandFicha";
import type { Profile } from "@/db/schema";

export function brandFichaFromProfile(profile: Profile): BrandFichaModel {
  return {
    id: profile.id,
    brandName: profile.brandName,
    displayName: profile.displayName,
    industry: profile.industry,
    category: profile.category,
    companyLocation: profile.companyLocation,
    city: profile.city,
    province: profile.province,
    handle: profile.handle,
    tiktokHandle: profile.tiktokHandle,
    contactPerson: profile.contactPerson,
    email: profile.email,
    phone: profile.phone,
    contactChannel: profile.contactChannel,
    goals: profile.goals,
    avatarUrl: profile.avatarUrl,
    website: profile.website,
    summary: profile.summary,
    galleryUrls: profile.galleryUrls,
    accountStatus: profile.accountStatus,
    onboardingCompleted: profile.onboardingCompleted,
  };
}
