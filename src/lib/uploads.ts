const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File, maxBytes: number = DEFAULT_MAX_BYTES) {
  if (!file.type.startsWith("image/")) {
    throw new Error("O arquivo precisa ser uma imagem.");
  }
  if (file.size > maxBytes) {
    throw new Error(`A imagem precisa ter no máximo ${Math.round(maxBytes / (1024 * 1024))}MB.`);
  }
}

export function fileExtension(file: File, fallback = "jpg") {
  return file.name.split(".").pop() || fallback;
}
