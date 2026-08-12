import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { redirectIfNotApproved, redirectIfPasswordMissing } from "@/lib/account-gate";
import { ensureProfile } from "@/lib/auth";
import { destinationForProfile, homeForRole } from "@/lib/roles";
import { DashboardNav } from "./DashboardNav";
import { initialsFromName } from "./brand-helpers";
import "./brand-dash.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await ensureProfile();
  if (!profile) redirect("/login?role=brand");
  redirectIfNotApproved(profile);
  await redirectIfPasswordMissing("/dashboard");
  if (profile.role !== "brand" && profile.role !== "admin") {
    redirect(destinationForProfile(profile) || homeForRole(profile.role));
  }

  const brandLabel =
    profile.brandName || profile.displayName || "Marca";
  const initials = initialsFromName(brandLabel);

  return (
    <div className="brand-app">
      <div className="app">
        <aside className="sidebar">
          <Logo
            href={profile.role === "admin" ? "/admin" : "/dashboard"}
            className="logo"
          />
          <DashboardNav isAdmin={profile.role === "admin"} />
          <div className="sidebar-account">
            <div className="av">{initials}</div>
            <div>
              <div className="name">{brandLabel}</div>
              <div className="role">
                {profile.role === "admin"
                  ? "Admin · vista marca"
                  : "Cuenta de marca"}
              </div>
            </div>
          </div>
          <LogoutButton className="sidebar-logout" />
        </aside>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
