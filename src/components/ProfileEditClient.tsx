"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminUpdateProfile, updateSelfProfile } from "@/app/actions";
import { OnboardingForm } from "@/components/OnboardingForm";
import type { OnboardingPayload } from "@/lib/onboarding";

export function ProfileEditClient({
  initial,
  variant = "dark",
  profileId,
}: {
  initial: OnboardingPayload;
  variant?: "dark" | "light";
  /** When set, saves via adminUpdateProfile for that user. */
  profileId?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      {saved ? (
        <p
          className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
            variant === "light"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-ok/40 bg-ok/10 text-ok"
          }`}
        >
          Perfil actualizado.
        </p>
      ) : null}
      {error ? (
        <p
          className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${
            variant === "light"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-bad/40 bg-bad/10 text-bad"
          }`}
        >
          {error}
        </p>
      ) : null}
      <OnboardingForm
        initial={initial}
        lockRole
        variant={variant}
        submitLabel="Guardar cambios"
        onComplete={async (data) => {
          setError(null);
          try {
            if (profileId) {
              await adminUpdateProfile(profileId, data);
            } else {
              await updateSelfProfile(data);
            }
            setSaved(true);
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo guardar");
          }
        }}
      />
    </div>
  );
}
