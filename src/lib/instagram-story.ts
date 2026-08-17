import { computeRarity, type PlayerAttributes, type Rarity } from "./gamification";

const TEMPLATE_SRC = "/instagram-story-template.png";
const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

// Tamanho "de projeto" da cartinha — todas as posições e fontes abaixo são
// proporcionais a essa largura, então CARD_WIDTH pode mudar livremente sem
// precisar recalcular cada número à mão (ver `S()`).
const BASE_WIDTH = 480;
const CARD_WIDTH = 700;
const CARD_HEIGHT = 1050;
const CARD_LEFT = (STORY_WIDTH - CARD_WIDTH) / 2;
const CARD_TOP = 640;

const RARITY_COLORS: Record<
  Rarity,
  { stops: [number, string][]; radial?: boolean; border: string; text: string; sub: string; divider: string }
> = {
  bronze: {
    stops: [
      [0, "#a2652f"],
      [0.5, "#8a4f22"],
      [1, "#5c3216"],
    ],
    border: "#e2a765",
    text: "#fbe4c8",
    sub: "rgba(240,196,151,0.8)",
    divider: "rgba(226,167,101,0.5)",
  },
  prata: {
    stops: [
      [0, "#e7ecef"],
      [0.5, "#b7c1c7"],
      [1, "#7c8a91"],
    ],
    border: "#ffffff",
    text: "#1c2226",
    sub: "rgba(58,68,74,0.8)",
    divider: "rgba(28,34,38,0.25)",
  },
  ouro: {
    stops: [
      [0, "#f6d979"],
      [0.5, "#dcab35"],
      [1, "#96701c"],
    ],
    border: "#fff2c2",
    text: "#3a2405",
    sub: "rgba(77,52,7,0.8)",
    divider: "rgba(58,36,5,0.25)",
  },
  legend: {
    stops: [
      [0, "#ffffff"],
      [0.45, "#f2ecd9"],
      [1, "#d8cca4"],
    ],
    radial: true,
    border: "#c9a94e",
    text: "#2a2412",
    sub: "rgba(90,79,44,0.8)",
    divider: "rgba(201,169,78,0.5)",
  },
};

const RARITY_LABELS: Record<Rarity, string> = {
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
  legend: "Legend",
};

const LEFT_ATTRIBUTES: [keyof PlayerAttributes, string][] = [
  ["ritmo", "RIT"],
  ["finalizacao", "FIN"],
  ["passe", "PAS"],
];
const RIGHT_ATTRIBUTES: [keyof PlayerAttributes, string][] = [
  ["drible", "DRI"],
  ["defesa", "DEF"],
  ["fisico", "FIS"],
];

function loadImage(src: string, crossOrigin?: "anonymous"): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${src}`));
    img.src = src;
  });
}

async function tryLoadImage(src: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!src) return null;
  try {
    return await loadImage(src, "anonymous");
  } catch {
    return null;
  }
}

function shieldPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, corner: number, tip: number) {
  ctx.beginPath();
  ctx.moveTo(x + corner, y);
  ctx.lineTo(x + w - corner, y);
  ctx.lineTo(x + w, y + corner);
  ctx.lineTo(x + w, y + h - tip);
  ctx.lineTo(x + w / 2, y + h);
  ctx.lineTo(x, y + h - tip);
  ctx.lineTo(x, y + corner);
  ctx.closePath();
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  size: number
) {
  const ratio = Math.max(size / img.width, size / img.height);
  const w = img.width * ratio;
  const h = img.height * ratio;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export type StoryCardData = {
  name: string;
  position: string | null;
  number?: number | null;
  photoUrl?: string | null;
  crestUrl?: string | null;
  attributes: PlayerAttributes;
  displayFontFamily: string;
  bodyFontFamily: string;
};

/**
 * Compõe a cartinha do jogador sobre a arte de story pronta (logo Kong's
 * League + "JOGADOR CONFIRMADO"), desenhando o card inteiro diretamente
 * via API de Canvas (não com html2canvas) — ver histórico no git log
 * desse arquivo pra entender por quê. Todo o layout interno é proporcional
 * a CARD_WIDTH via `S()`, então o tamanho da cartinha pode ser ajustado só
 * mudando CARD_WIDTH/CARD_HEIGHT no topo do arquivo.
 */
export async function composeInstagramStoryImage(card: StoryCardData): Promise<Blob> {
  const rarity = computeRarity(card.attributes.ovr);
  const colors = RARITY_COLORS[rarity];
  const scale = CARD_WIDTH / BASE_WIDTH;
  const S = (value: number) => value * scale;

  const [templateImg, photoImg, crestImg] = await Promise.all([
    loadImage(TEMPLATE_SRC),
    tryLoadImage(card.photoUrl),
    tryLoadImage(card.crestUrl),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível compor a imagem.");

  ctx.drawImage(templateImg, 0, 0, STORY_WIDTH, STORY_HEIGHT);

  const x = CARD_LEFT;
  const y = CARD_TOP;
  const w = CARD_WIDTH;
  const h = CARD_HEIGHT;
  const corner = S(30);
  const tip = S(64);
  const pad = S(34);

  ctx.save();
  shieldPath(ctx, x, y, w, h, corner, tip);
  ctx.clip();

  let gradient: CanvasGradient;
  if (colors.radial) {
    gradient = ctx.createRadialGradient(x + w / 2, y + h * 0.2, 0, x + w / 2, y + h * 0.2, h * 0.9);
  } else {
    gradient = ctx.createLinearGradient(0, y, 0, y + h);
  }
  for (const [offset, color] of colors.stops) gradient.addColorStop(offset, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, w, h);

  // OVR e posição
  ctx.fillStyle = colors.text;
  ctx.textBaseline = "alphabetic";
  ctx.font = `900 ${S(68)}px ${card.displayFontFamily}`;
  ctx.textAlign = "left";
  ctx.fillText(String(Math.round(card.attributes.ovr)), x + pad, y + S(100));
  ctx.font = `700 ${S(20)}px ${card.bodyFontFamily}`;
  ctx.fillText((card.position ?? "—").toUpperCase(), x + pad, y + S(130));

  // Escudo do time
  const crestRadius = S(30);
  const crestCenter = { x: x + w - pad - crestRadius, y: y + S(68) };
  if (crestImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(crestCenter.x, crestCenter.y, crestRadius, 0, Math.PI * 2);
    ctx.clip();
    drawCoverImage(ctx, crestImg, crestCenter.x, crestCenter.y, crestRadius * 2);
    ctx.restore();
  }

  // Foto do jogador (ou iniciais)
  const photoCenter = { x: x + w / 2, y: y + S(260) };
  const photoRadius = S(108);
  if (photoImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(photoCenter.x, photoCenter.y, photoRadius, 0, Math.PI * 2);
    ctx.clip();
    drawCoverImage(ctx, photoImg, photoCenter.x, photoCenter.y, photoRadius * 2);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(photoCenter.x, photoCenter.y, photoRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = S(4);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(photoCenter.x, photoCenter.y, photoRadius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = S(4);
    ctx.stroke();
    ctx.fillStyle = colors.text;
    ctx.font = `700 ${S(48)}px ${card.displayFontFamily}`;
    ctx.textAlign = "center";
    ctx.fillText(initials(card.name), photoCenter.x, photoCenter.y + S(16));
  }

  // Nome e raridade
  ctx.textAlign = "center";
  ctx.fillStyle = colors.text;
  ctx.font = `700 ${S(34)}px ${card.displayFontFamily}`;
  const namePrefix = card.number ? `${card.number} · ` : "";
  const nameLine = truncateToWidth(ctx, `${namePrefix}${card.name}`.toUpperCase(), w - pad * 2);
  ctx.fillText(nameLine, x + w / 2, y + S(428));

  ctx.fillStyle = colors.sub;
  ctx.font = `600 ${S(20)}px ${card.bodyFontFamily}`;
  ctx.fillText(RARITY_LABELS[rarity], x + w / 2, y + S(460));

  // Divisória
  ctx.strokeStyle = colors.divider;
  ctx.lineWidth = S(1.5);
  ctx.beginPath();
  ctx.moveTo(x + pad + S(20), y + S(486));
  ctx.lineTo(x + w - pad - S(20), y + S(486));
  ctx.stroke();

  // Atributos — número centralizado num "slot" fixo, seguido do rótulo,
  // pra ficar alinhado independente do número ter 1 ou 2 dígitos.
  const rowStartY = y + S(530);
  const rowGap = S(46);
  const numberSlot = S(46);
  const colLeftX = x + pad + S(16);
  const colRightX = x + w / 2 + S(16);

  function drawAttributeColumn(
    context: CanvasRenderingContext2D,
    colX: number,
    attrs: [keyof PlayerAttributes, string][]
  ) {
    attrs.forEach(([key, label], index) => {
      const rowY = rowStartY + index * rowGap;
      context.fillStyle = colors.text;
      context.font = `700 ${S(28)}px ${card.bodyFontFamily}`;
      context.textAlign = "center";
      context.fillText(String(Math.round(card.attributes[key])), colX + numberSlot / 2, rowY);
      context.fillStyle = colors.sub;
      context.font = `700 ${S(18)}px ${card.bodyFontFamily}`;
      context.textAlign = "left";
      context.fillText(label, colX + numberSlot + S(10), rowY);
    });
  }

  drawAttributeColumn(ctx, colLeftX, LEFT_ATTRIBUTES);
  drawAttributeColumn(ctx, colRightX, RIGHT_ATTRIBUTES);

  ctx.restore();

  // Contorno da cartinha
  shieldPath(ctx, x, y, w, h, corner, tip);
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = S(3);
  ctx.stroke();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Falha ao gerar imagem."));
    }, "image/png");
  });
}
