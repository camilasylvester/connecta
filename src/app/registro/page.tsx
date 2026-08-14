import { redirect } from "next/navigation";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string; tab?: string }>;
}) {
  const { role, next, tab } = await searchParams;
  const params = new URLSearchParams();
  params.set("tab", tab === "login" ? "login" : "signup");
  if (role === "brand") params.set("as", "marca");
  if (role === "creator") params.set("as", "creador");
  if (next) params.set("next", next);
  redirect(`/login?${params.toString()}`);
}
