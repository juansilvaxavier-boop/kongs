import type { jsPDF } from "jspdf";
import type autoTable from "jspdf-autotable";

export type SumulaPdfPlayer = { id: string; name: string; team_id: string | null };
export type SumulaPdfGoalEvent = { player_id: string; minute: number | null };
export type SumulaPdfCardEvent = { player_id: string; card_type: string; minute: number | null };

/** Dados de um jogo prontos pra desenhar — os crests já vêm convertidos
 * pra data URL (ver `loadImageAsDataUrl`), pra `drawSumulaSection` não
 * precisar ser assíncrona. */
export type SumulaPdfGameData = {
  round?: string | null;
  date?: string | null;
  venueName?: string | null;
  teamAName: string;
  teamBName: string;
  teamACrestDataUrl?: string | null;
  teamBCrestDataUrl?: string | null;
  scoreA: number | null;
  scoreB: number | null;
  teamAPlayers: SumulaPdfPlayer[];
  teamBPlayers: SumulaPdfPlayer[];
  goalEvents: SumulaPdfGoalEvent[];
  cardEvents: SumulaPdfCardEvent[];
};

/** Cabeçalho do campeonato, repetido em toda súmula (logo + nome, edição,
 * cidade, arena). `logoDataUrl` já vem convertido — ver `loadImageAsDataUrl`. */
export type SumulaPdfChampionship = {
  name: string;
  edition?: string | null;
  city?: string | null;
  arenaName?: string | null;
  logoDataUrl?: string | null;
};

/** Baixa uma imagem (logo do campeonato, escudo de time) e converte pra
 * data URL, formato que o jsPDF entende via `addImage`. Retorna null se
 * falhar — a súmula é gerada normalmente sem a imagem nesse caso. */
export async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function imageFormatFromDataUrl(dataUrl: string): string {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  return "JPEG";
}

function teamRows(
  teamPlayers: SumulaPdfPlayer[],
  goalEvents: SumulaPdfGoalEvent[],
  cardEvents: SumulaPdfCardEvent[]
) {
  return teamPlayers.map((player) => [
    player.name,
    goalEvents.filter((g) => g.player_id === player.id).length,
    cardEvents.filter((c) => c.player_id === player.id && c.card_type === "yellow").length,
    cardEvents.filter((c) => c.player_id === player.id && c.card_type === "red").length,
  ]);
}

const PAGE_LEFT = 14;
const PAGE_RIGHT = 196;

/** Caixa com rótulo em cima (pequeno, maiúsculo) e valor embaixo — o
 * mesmo estilo de campo destacado do modelo de súmula em papel. */
function drawInfoBox(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string
) {
  doc.setDrawColor(160);
  doc.rect(x, y, w, h);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(90);
  doc.text(label, x + 2, y + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(20);
  const lines = doc.splitTextToSize(value || "—", w - 4);
  doc.text(lines.slice(0, 2), x + 2, y + 9.5);
}

function drawCrest(doc: jsPDF, dataUrl: string | null | undefined, x: number, y: number, size: number) {
  if (!dataUrl) return;
  try {
    doc.addImage(dataUrl, imageFormatFromDataUrl(dataUrl), x, y, size, size);
  } catch {
    // Segue sem o escudo se a imagem não puder ser processada.
  }
}

/**
 * Desenha uma súmula (cabeçalho do campeonato, grade de dados do jogo,
 * placar com os escudos e tabela de cada time) a partir do topo da
 * página atual do documento. Compartilhado entre o botão de baixar uma
 * súmula e o de baixar várias juntas num PDF só (uma por página, cada
 * uma com o mesmo cabeçalho).
 */
export function drawSumulaSection(
  doc: jsPDF,
  drawTable: typeof autoTable,
  game: SumulaPdfGameData,
  championship: SumulaPdfChampionship
) {
  doc.setTextColor(0);

  const logoSize = 16;
  const hasLogo = Boolean(championship.logoDataUrl);
  const textX = hasLogo ? PAGE_LEFT + logoSize + 4 : PAGE_LEFT;

  drawCrest(doc, championship.logoDataUrl, PAGE_LEFT, 6, logoSize);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(championship.name, textX, 13);

  if (championship.edition) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(championship.edition, textX, 18.5);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("SÚMULA OFICIAL DE JOGO", (PAGE_LEFT + PAGE_RIGHT) / 2, 27, { align: "center" });

  doc.setDrawColor(160);
  doc.line(PAGE_LEFT, 30, PAGE_RIGHT, 30);

  const formattedDate = game.date
    ? new Date(game.date).toLocaleDateString("pt-BR")
    : null;
  const formattedTime = game.date
    ? new Date(game.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  const row1Y = 34;
  const row1H = 12;
  const col1W = 61;
  const col2W = 61;
  const col3W = PAGE_RIGHT - PAGE_LEFT - col1W - col2W;
  drawInfoBox(doc, PAGE_LEFT, row1Y, col1W, row1H, "DATA", formattedDate ?? "—");
  drawInfoBox(doc, PAGE_LEFT + col1W, row1Y, col2W, row1H, "HORÁRIO", formattedTime ?? "—");
  drawInfoBox(
    doc,
    PAGE_LEFT + col1W + col2W,
    row1Y,
    col3W,
    row1H,
    "FASE",
    game.round ?? "—"
  );

  const row2Y = row1Y + row1H;
  const halfW = (PAGE_RIGHT - PAGE_LEFT) / 2;
  drawInfoBox(doc, PAGE_LEFT, row2Y, halfW, row1H, "LOCAL", championship.arenaName ?? game.venueName ?? "—");
  drawInfoBox(doc, PAGE_LEFT + halfW, row2Y, halfW, row1H, "CIDADE", championship.city ?? "—");

  const crestSize = 14;
  const scoreY = row2Y + row1H + 12;
  drawCrest(doc, game.teamACrestDataUrl, PAGE_LEFT, scoreY - 10, crestSize);
  drawCrest(doc, game.teamBCrestDataUrl, PAGE_RIGHT - crestSize, scoreY - 10, crestSize);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(
    `${game.teamAName}  ${game.scoreA ?? 0} x ${game.scoreB ?? 0}  ${game.teamBName}`,
    (PAGE_LEFT + PAGE_RIGHT) / 2,
    scoreY,
    { align: "center" }
  );
  doc.setFont("helvetica", "normal");

  const tableStartY = scoreY + 10;

  drawTable(doc, {
    startY: tableStartY,
    head: [[game.teamAName, "Gols", "Cartão amarelo", "Cartão vermelho"]],
    body: teamRows(game.teamAPlayers, game.goalEvents, game.cardEvents),
  });

  const afterTeamA = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  drawTable(doc, {
    startY: afterTeamA + 8,
    head: [[game.teamBName, "Gols", "Cartão amarelo", "Cartão vermelho"]],
    body: teamRows(game.teamBPlayers, game.goalEvents, game.cardEvents),
  });
}
