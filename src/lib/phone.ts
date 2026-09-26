/**
 * Validación y normalización de celulares (T-38): Argentina, Uruguay, Chile y
 * España — los mismos países que la ubicación (src/lib/geo.ts).
 *
 * Formato guardado: "+<código> <número>", legible (ej. "+54 9 11 1234-5678",
 * "+598 94 123 456"). Un número SIN "+" se interpreta como argentino: así
 * siguen valiendo todos los que se cargaron antes de sumar países.
 */

export type PhoneCountryCode = "AR" | "UY" | "CL" | "ES";

export type PhoneCountry = {
  code: PhoneCountryCode;
  name: string;
  /** Código telefónico internacional, sin "+". */
  dial: string;
  /** Ejemplo del número nacional, para el placeholder. */
  example: string;
};

export const PHONE_COUNTRIES: readonly PhoneCountry[] = [
  { code: "AR", name: "Argentina", dial: "54", example: "11 1234-5678" },
  { code: "UY", name: "Uruguay", dial: "598", example: "94 123 456" },
  { code: "CL", name: "Chile", dial: "56", example: "9 1234 5678" },
  { code: "ES", name: "España", dial: "34", example: "612 34 56 78" },
];

export function phoneCountry(code: string | null | undefined): PhoneCountry | null {
  return PHONE_COUNTRIES.find((c) => c.code === code) || null;
}

type ParsedMobile = {
  country: PhoneCountryCode;
  /** Número nacional sin prefijos ni ceros/9/15 de marcación. */
  national: string;
  /** Dígitos para wa.me (código de país + número). */
  waDigits: string;
};

/** Argentina: 10 dígitos nacionales; WhatsApp necesita el 9 de móvil (549…). */
function parseAr(digits: string): ParsedMobile | null {
  let n = digits;
  if (n.startsWith("54")) n = n.slice(2);
  if (n.startsWith("0")) n = n.slice(1);
  if (n.startsWith("9")) n = n.slice(1);
  // Formato viejo local 15xxxxxxxx (10 dígitos) → sacar 15
  if (n.startsWith("15") && n.length === 10) n = n.slice(2);
  if (n.length !== 10) return null;
  return { country: "AR", national: n, waDigits: `549${n}` };
}

/** Uruguay: móviles 09X XXX XXX → 8 dígitos que empiezan con 9. */
function parseUy(national: string): ParsedMobile | null {
  const n = national.replace(/^0/, "");
  if (!/^9\d{7}$/.test(n)) return null;
  return { country: "UY", national: n, waDigits: `598${n}` };
}

/** Chile: móviles de 9 dígitos que empiezan con 9. */
function parseCl(national: string): ParsedMobile | null {
  if (!/^9\d{8}$/.test(national)) return null;
  return { country: "CL", national, waDigits: `56${national}` };
}

/** España: móviles de 9 dígitos que empiezan con 6 o 7. */
function parseEs(national: string): ParsedMobile | null {
  if (!/^[67]\d{8}$/.test(national)) return null;
  return { country: "ES", national, waDigits: `34${national}` };
}

/** Interpreta un celular de cualquiera de los 4 países, o null si no es válido. */
export function parseMobile(input: string | null | undefined): ParsedMobile | null {
  const trimmed = input?.trim() || "";
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  // Con prefijo internacional explícito ("+598…" o "00598…").
  const international = trimmed.startsWith("+") || trimmed.startsWith("00");
  if (international) {
    const d = trimmed.startsWith("00") ? digits.slice(2) : digits;
    if (d.startsWith("598")) return parseUy(d.slice(3));
    if (d.startsWith("56")) return parseCl(d.slice(2));
    if (d.startsWith("34")) return parseEs(d.slice(2));
    if (d.startsWith("54")) return parseAr(d);
    return null;
  }
  // Sin "+": argentino, como siempre.
  return parseAr(digits);
}

/** Dígitos para wa.me (código de país + número), o null si no es válido. */
export function normalizeMobileDigits(input: string): string | null {
  return parseMobile(input)?.waDigits || null;
}

export function isValidMobile(input: string): boolean {
  return parseMobile(input) !== null;
}

export function mobileValidationError(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return "El teléfono es obligatorio.";
  if (!isValidMobile(trimmed)) {
    return "Usá un celular válido de Argentina, Uruguay, Chile o España (elegí el prefijo del país).";
  }
  return null;
}

/** Link directo a WhatsApp. null si el número no es válido. */
export function whatsappUrl(input: string | null | undefined): string | null {
  const parsed = parseMobile(input);
  return parsed ? `https://wa.me/${parsed.waDigits}` : null;
}

/** Formato legible con prefijo. Si no es válido, devuelve el texto tal cual. */
export function formatMobileDisplay(input: string | null | undefined): string {
  if (!input?.trim()) return "";
  const parsed = parseMobile(input);
  if (!parsed) return input.trim();
  const n = parsed.national;
  switch (parsed.country) {
    case "AR": {
      // Área de 2 dígitos (AMBA) → "11 1234-5678"; el resto se deja corrido.
      const rest = n.slice(2);
      return rest.length === 8
        ? `+54 9 ${n.slice(0, 2)} ${rest.slice(0, 4)}-${rest.slice(4)}`
        : `+54 9 ${n}`;
    }
    case "UY":
      return `+598 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}`;
    case "CL":
      return `+56 ${n.slice(0, 1)} ${n.slice(1, 5)} ${n.slice(5)}`;
    case "ES":
      return `+34 ${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7)}`;
  }
}

/**
 * Separa un número guardado en país + resto, para mostrarlo en PhoneInput.
 * Sin "+" (números viejos) se toma como Argentina.
 */
export function splitPhoneForInput(value: string): {
  country: PhoneCountryCode | null;
  rest: string;
} {
  const trimmed = value.trim();
  if (!trimmed) return { country: null, rest: "" };
  if (!trimmed.startsWith("+")) return { country: "AR", rest: trimmed };
  // Probar primero los códigos más largos ("598" antes que "5x").
  const byLength = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of byLength) {
    const prefix = `+${c.dial}`;
    if (trimmed.startsWith(prefix)) {
      return { country: c.code, rest: trimmed.slice(prefix.length).trim() };
    }
  }
  return { country: null, rest: trimmed };
}
