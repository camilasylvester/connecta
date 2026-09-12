"use client";

import Link from "next/link";
import { PRIVACY_PATH, TERMS_PATH } from "@/lib/terms";

export function TermsAcceptCheckbox({
  checked,
  onChange,
  id = "terms-accept",
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  id?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={className}
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        fontSize: 13,
        lineHeight: 1.45,
        cursor: "pointer",
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
        style={{ marginTop: 3, flexShrink: 0 }}
      />
      <span>
        Acepto los{" "}
        <Link href={TERMS_PATH} target="_blank" rel="noopener noreferrer">
          Términos y condiciones
        </Link>{" "}
        y la{" "}
        <Link href={PRIVACY_PATH} target="_blank" rel="noopener noreferrer">
          Política de privacidad
        </Link>
        .
      </span>
    </label>
  );
}
