import { Suspense } from "react";
import { RegistroCreadorV3Form } from "@/components/RegistroCreadorV3Form";
import "../../auth.css";

function RegistroCreadorInner({
  searchParams,
}: {
  searchParams: { instagram?: string; next?: string };
}) {
  const instagram = searchParams.instagram || "";
  const next = searchParams.next || "";

  return (
    <RegistroCreadorV3Form initialInstagram={instagram} next={next} />
  );
}

export default async function RegistroCreadorPage({
  searchParams,
}: {
  searchParams: Promise<{ instagram?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-dark">
          Cargando…
        </div>
      }
    >
      <RegistroCreadorInner searchParams={params} />
    </Suspense>
  );
}
