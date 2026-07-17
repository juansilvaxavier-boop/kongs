const DEFAULT_MAX_BYTES = 15 * 1024 * 1024;
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "avif"];

export function validateImageFile(file: File, maxBytes: number = DEFAULT_MAX_BYTES) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const looksLikeImage =
    file.type.startsWith("image/") || (!file.type && IMAGE_EXTENSIONS.includes(extension));

  if (!looksLikeImage) {
    throw new Error("O arquivo precisa ser uma imagem.");
  }
  if (file.size > maxBytes) {
    throw new Error(`A imagem precisa ter no máximo ${Math.round(maxBytes / (1024 * 1024))}MB.`);
  }
}

export function fileExtension(file: File, fallback = "jpg") {
  return file.name.split(".").pop() || fallback;
}
