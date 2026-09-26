"use client";

import { useState } from "react";
import {
  PHONE_COUNTRIES,
  phoneCountry,
  splitPhoneForInput,
  type PhoneCountryCode,
} from "@/lib/phone";
import "./phone-input.css";

/**
 * Celular con prefijo de país (T-38). El valor que sube es "+<código> <número>"
 * tal cual lo escribió la persona; la validación y el formato final los hace
 * src/lib/phone.ts. Los números viejos sin "+" se muestran como Argentina.
 */
export function PhoneInput({
  value,
  onChange,
  defaultCountry,
  id,
  inputClassName = "",
  selectClassName = "",
  disabled = false,
  autoFocus = false,
  required = false,
}: {
  value: string;
  onChange: (next: string) => void;
  /** País sugerido si todavía no hay número (ej. el de la ubicación). */
  defaultCountry?: string | null;
  id?: string;
  inputClassName?: string;
  selectClassName?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  required?: boolean;
}) {
  const split = splitPhoneForInput(value);
  // Lo que eligió en el selector gana; si no tocó nada, manda el número
  // guardado, después el país sugerido y por último Argentina.
  const [picked, setPicked] = useState<PhoneCountryCode | null>(null);
  const code: PhoneCountryCode =
    picked ||
    split.country ||
    (phoneCountry(defaultCountry)?.code ?? "AR");
  const country = phoneCountry(code) || PHONE_COUNTRIES[0];

  function emit(nextCode: PhoneCountryCode, rest: string) {
    const dial = phoneCountry(nextCode)?.dial || "54";
    onChange(rest.trim() ? `+${dial} ${rest.trim()}` : "");
  }

  return (
    <div className="phone-input">
      <select
        aria-label="Prefijo del país"
        className={`phone-input-select ${selectClassName}`}
        value={code}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value as PhoneCountryCode;
          setPicked(next);
          emit(next, split.rest);
        }}
      >
        {PHONE_COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name} +{c.dial}
          </option>
        ))}
      </select>
      <input
        id={id}
        className={`phone-input-number ${inputClassName}`}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={split.rest}
        placeholder={country.example}
        disabled={disabled}
        autoFocus={autoFocus}
        required={required}
        onChange={(e) => emit(code, e.target.value)}
      />
    </div>
  );
}
