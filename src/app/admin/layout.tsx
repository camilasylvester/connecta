import { redirect } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { redirectIfPasswordMissing } from "@/lib/account-gate";
import { ensureProfile } from "@/lib/auth";
import { destinationForProfile } from "@/lib/roles";
import "../dashboard/brand-dash.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await ensureProfile();
  if (!profile) redirect("/login?role=admin");
  if (profile.role !== "admin") redirect(destinationForProfile(profile));
  await redirectIfPasswordMissing("/admin");

  return (
    <AdminShell displayName={profile.displayName || "Admin"}>
      {children}
    </AdminShell>
  );
}
