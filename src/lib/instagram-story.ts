const TEMPLATE_SRC = "/instagram-story-template.png";
const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;
// Largura final da cartinha na arte, e ponto onde ela começa (canto
// superior esquerdo) — o card em si é sempre 224px de largura (tamanho
// "lg" em player-card.tsx), escalado via CSS transform até esse valor.
const CARD_WIDTH = 480;
const CARD_SOURCE_WIDTH = 224;
const CARD_LEFT = (STORY_WIDTH - CARD_WIDTH) / 2;
const CARD_TOP = 700;

/**
 * Compõe a cartinha do jogador sobre a arte de story pronta (logo Kong's
 * League + "JOGADOR CONFIRMADO"), centralizada na área em branco abaixo do
 * texto, gerando um único PNG no formato de story (1080x1920).
 *
 * Em vez de capturar a cartinha e a arte em canvases separados e tentar
 * encaixar um no outro por conta (o que se mostrou impreciso em produção),
 * montamos um palco fora da tela já com o tamanho e a posição finais em
 * CSS e tiramos uma única "foto" dele com html2canvas — assim o que sai é
 * exatamente o que foi montado, sem contas de escala por fora.
 */
export async function composeInstagramStoryImage(cardTargetId: string): Promise<Blob> {
  const cardEl = document.getElementById(cardTargetId);
  if (!cardEl) throw new Error("Cartinha não encontrada.");

  const stage = document.createElement("div");
  stage.style.position = "fixed";
  stage.style.left = "-10000px";
  stage.style.top = "0";
  stage.style.width = `${STORY_WIDTH}px`;
  stage.style.height = `${STORY_HEIGHT}px`;
  stage.style.backgroundImage = `url(${TEMPLATE_SRC})`;
  stage.style.backgroundSize = "cover";
  stage.style.backgroundRepeat = "no-repeat";
  stage.style.overflow = "hidden";

  const cardClone = cardEl.cloneNode(true) as HTMLElement;
  cardClone.style.position = "absolute";
  cardClone.style.left = `${CARD_LEFT}px`;
  cardClone.style.top = `${CARD_TOP}px`;
  cardClone.style.transformOrigin = "top left";
  cardClone.style.transform = `scale(${CARD_WIDTH / CARD_SOURCE_WIDTH})`;
  stage.appendChild(cardClone);

  document.body.appendChild(stage);
  try {
    const { default: html2canvas } = await import("html2canvas-pro");
    const canvas = await html2canvas(stage, {
      useCORS: true,
      backgroundColor: "#ffffff",
      width: STORY_WIDTH,
      height: STORY_HEIGHT,
      // Sem isso, a lib multiplica pela densidade de tela do aparelho (3x
      // em boa parte dos celulares) e o canvas final passa do limite de
      // tamanho do Safari no iOS, que corta o excesso sem avisar erro.
      // 1080x1920 já é a resolução final desejada, não precisa de mais.
      scale: 1,
    });

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Falha ao gerar imagem."));
      }, "image/png");
    });
  } finally {
    document.body.removeChild(stage);
  }
}
