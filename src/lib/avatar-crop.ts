/**
 * Recorta una imagen al cuadrado del centro (400x400) y la devuelve como
 * data URL JPEG, lista para `uploadConnectaImage`. Solo navegador (usa canvas).
 * Si queda pesada (>450 KB en base64) se baja la calidad para no pasar el
 * límite de subida.
 */
export async function cropToSquareDataUrl(file: File): Promise<string> {
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
  const size = 400;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  const out = canvas.toDataURL("image/jpeg", 0.82);
  return out.length > 450_000 ? canvas.toDataURL("image/jpeg", 0.6) : out;
}
