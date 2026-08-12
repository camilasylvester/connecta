/** Client-side image compress to data URL (JPEG). */
export async function compressImageFile(
  file: File,
  maxSide = 1200
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Imagen inválida"));
    el.src = dataUrl;
  });

  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  ctx.drawImage(img, 0, 0, w, h);

  let out = canvas.toDataURL("image/jpeg", 0.78);
  if (out.length > 450_000) {
    out = canvas.toDataURL("image/jpeg", 0.55);
  }
  return out;
}

/** https Blob URLs (new) or legacy data-URLs already saved in Neon. */
export function isAllowedStoredImageUrl(url: string): boolean {
  if (typeof url !== "string" || !url) return false;
  if (url.startsWith("data:image/")) return true;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export function parseImageUrlsField(raw: FormDataEntryValue | null): string[] {
  if (raw == null || raw === "") return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is string => typeof x === "string" && isAllowedStoredImageUrl(x))
      .slice(0, 5);
  } catch {
    return [];
  }
}
