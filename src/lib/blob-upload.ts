"use server";

import { put } from "@vercel/blob";
import { requireUserId } from "@/lib/auth";

const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Upload an image to Vercel Blob.
 * FormData: "file" (File) and/or "dataUrl" (compressed data URL),
 * optional "folder" = avatars | events | misc.
 * Returns a public https URL to store in Neon (not the binary).
 */
export async function uploadConnectaImage(formData: FormData): Promise<{
  url: string;
}> {
  await requireUserId();

  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    throw new Error(
      "Falta configurar almacenamiento de imágenes (Vercel Blob)."
    );
  }

  const folderRaw = String(formData.get("folder") || "misc");
  const folder = ["avatars", "events", "misc"].includes(folderRaw)
    ? folderRaw
    : "misc";

  let file: File | null = null;
  const rawFile = formData.get("file");
  if (rawFile instanceof File && rawFile.size > 0) {
    file = rawFile;
  } else {
    const dataUrl = formData.get("dataUrl");
    if (typeof dataUrl === "string" && dataUrl.startsWith("data:image/")) {
      const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
      if (!match) throw new Error("Imagen inválida");
      const contentType = match[1];
      const bin = Buffer.from(match[2], "base64");
      if (!contentType.startsWith("image/")) {
        throw new Error("Formato de imagen no permitido");
      }
      if (bin.length > MAX_BYTES) {
        throw new Error("La imagen es demasiado grande. Probá otra más liviana.");
      }
      file = new File([bin], `${folder}.jpg`, { type: contentType });
    }
  }

  if (!file) throw new Error("No se recibió ninguna imagen");
  if (file.size > MAX_BYTES) {
    throw new Error("La imagen es demasiado grande (máx. ~4 MB).");
  }
  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("Solo se permiten imágenes");
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const pathname = `connecta/${folder}/${crypto.randomUUID()}.${ext}`;

  const blob = await put(pathname, file, {
    access: "public",
    contentType: file.type || "image/jpeg",
    addRandomSuffix: false,
  });

  return { url: blob.url };
}
