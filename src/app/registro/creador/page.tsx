import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/** Legacy URL: access is first now, then profile at /completar-perfil. */
export default async function RegistroCreadorPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; instagram?: string }>;
}) {
  const { next, instagram } = await searchParams;
  const { userId } = await auth();
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  if (instagram) params.set("instagram", instagram);
  const qs = params.toString();

  if (!userId) {
    redirect(`/login?tab=signup&as=creador${qs ? `&${qs}` : ""}`);
  }

  redirect(`/completar-perfil${qs ? `?${qs}` : ""}`);
}
