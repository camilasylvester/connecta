/** Validación y normalización de celular argentino (+54 9 …). */

/** Digitos para wa.me: 549 + 10 dígitos (área + número). */
export function normalizeArMobileDigits(input: string): string | null {
  let n = input.replace(/\D/g, "");
  if (!n) return null;

  if (n.startsWith("54")) n = n.slice(2);
  if (n.startsWith("0")) n = n.slice(1);
  if (n.startsWith("9")) n = n.slice(1);
  // Formato viejo local 15xxxxxxxx (10 dígitos) → sacar 15
  if (n.startsWith("15") && n.length === 10) n = n.slice(2);

  if (n.length !== 10) return null;
  // Celulares AR: el nacional móvil queda en 10 dígitos (ej. 11xxxxxxxx)
  return `549${n}`;
}

export function isValidArMobile(input: string): boolean {
  return normalizeArMobileDigits(input) !== null;
}

export function arMobileValidationError(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return "El teléfono es obligatorio.";
  if (!isValidArMobile(trimmed)) {
    return "Usá un celular argentino válido (ej. +54 9 11 1234-5678 o 11 1234-5678).";
  }
  return null;
}

/** Link directo a WhatsApp. null si el número no es válido. */
export function whatsappUrl(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const digits = normalizeArMobileDigits(input);
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

/** Formato legible +54 9 … */
export function formatArMobileDisplay(input: string | null | undefined): string {
  if (!input?.trim()) return "";
  const digits = normalizeArMobileDigits(input);
  if (!digits) return input.trim();
  const national = digits.slice(3); // after 549
  const area = national.slice(0, 2);
  const rest = national.slice(2);
  if (rest.length === 8) {
    return `+54 9 ${area} ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  return `+54 9 ${national}`;
}
