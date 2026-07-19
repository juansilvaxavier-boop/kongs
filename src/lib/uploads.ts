const DEFAULT_MAX_BYTES = 15 * 1024 * 1024;

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  avif: "image/avif",
};

function extensionOf(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

export function validateImageFile(file: File, maxBytes: number = DEFAULT_MAX_BYTES) {
  // A extensão precisa estar na lista permitida (svg fica de fora de
  // propósito — pode embutir <script>) independente do que o cliente
  // declarar em `file.type`, já que esse campo é livremente controlado
  // por quem faz o upload e não pode ser a única defesa.
  const extension = extensionOf(file);
  if (!(extension in IMAGE_MIME_BY_EXTENSION)) {
    throw new Error("O arquivo precisa ser uma imagem (jpg, png, webp, gif, heic, heif ou avif).");
  }
  if (file.size > maxBytes) {
    throw new Error(`A imagem precisa ter no máximo ${Math.round(maxBytes / (1024 * 1024))}MB.`);
  }
}

export function fileExtension(file: File, fallback = "jpg") {
  return extensionOf(file) || fallback;
}

/**
 * Content-Type a usar no upload para o Storage, derivado da extensão já
 * validada por `validateImageFile` — nunca do `file.type` enviado pelo
 * cliente. Se o objeto fosse salvo com o Content-Type que o próprio
 * cliente escolhe (ex.: "image/svg+xml"), um arquivo malicioso serviria
 * esse cabeçalho na URL pública e poderia executar script ao ser aberto
 * diretamente no navegador.
 */
export function imageContentType(file: File): string {
  return IMAGE_MIME_BY_EXTENSION[extensionOf(file)] ?? "application/octet-stream";
}
