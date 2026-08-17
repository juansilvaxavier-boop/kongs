const TEMPLATE_SRC = "/instagram-story-template.png";
// Área abaixo do texto "JOGADOR CONFIRMADO" (que termina por volta de y=620)
// dentro da arte de 1080x1920. Bem menor que o espaço disponível de propósito,
// com boa margem de segurança pro caso do app de destino re-enquadrar a imagem.
const CARD_BOX = { x: 300, y: 700, width: 480, height: 1000 };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar a arte modelo."));
    img.src = src;
  });
}

/**
 * Compõe a cartinha do jogador sobre a arte de story pronta (logo Kong's
 * League + "JOGADOR CONFIRMADO"), centralizada na área em branco abaixo do
 * texto, gerando um único PNG no formato de story (1080x1920).
 */
export async function composeInstagramStoryImage(cardTargetId: string): Promise<Blob> {
  const cardEl = document.getElementById(cardTargetId);
  if (!cardEl) throw new Error("Cartinha não encontrada.");

  const { default: html2canvas } = await import("html2canvas-pro");
  const [templateImg, cardCanvas] = await Promise.all([
    loadImage(TEMPLATE_SRC),
    html2canvas(cardEl, { backgroundColor: null, scale: 3, useCORS: true }),
  ]);

  const composite = document.createElement("canvas");
  composite.width = templateImg.naturalWidth;
  composite.height = templateImg.naturalHeight;
  const ctx = composite.getContext("2d");
  if (!ctx) throw new Error("Não foi possível compor a imagem.");

  ctx.drawImage(templateImg, 0, 0);

  const scale = Math.min(CARD_BOX.width / cardCanvas.width, CARD_BOX.height / cardCanvas.height);
  const drawWidth = cardCanvas.width * scale;
  const drawHeight = cardCanvas.height * scale;
  const dx = CARD_BOX.x + (CARD_BOX.width - drawWidth) / 2;
  const dy = CARD_BOX.y + (CARD_BOX.height - drawHeight) / 2;
  ctx.drawImage(cardCanvas, dx, dy, drawWidth, drawHeight);

  return new Promise((resolve, reject) => {
    composite.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Falha ao gerar imagem."));
    }, "image/png");
  });
}
