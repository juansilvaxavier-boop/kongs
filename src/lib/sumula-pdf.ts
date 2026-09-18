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
  doc.setFontSize(6);
  doc.setTextColor(90);
  doc.text(label, x + 2, y + 3.3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(20);
  const lines = doc.splitTextToSize(value || "—", w - 4);
  doc.text(lines.slice(0, 2), x + 2, y + 7);
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
 *
 * Tudo aqui é dimensionado pra caber inteiro numa folha A4 (inclusive as
 * duas tabelas de time, lado a lado em vez de uma embaixo da outra —
 * cabe o dobro de jogadores na mesma altura sem cortar nenhuma coluna):
 * cabeçalho compacto + fontes/preenchimento pequenos nas tabelas.
 */
export function drawSumulaSection(
  doc: jsPDF,
  drawTable: typeof autoTable,
  game: SumulaPdfGameData,
  championship: SumulaPdfChampionship
) {
  doc.setTextColor(0);

  const logoSize = 13;
  const hasLogo = Boolean(championship.logoDataUrl);
  const textX = hasLogo ? PAGE_LEFT + logoSize + 3 : PAGE_LEFT;

  drawCrest(doc, championship.logoDataUrl, PAGE_LEFT, 5, logoSize);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(championship.name, textX, 11);

  if (championship.edition) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(championship.edition, textX, 15.5);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("SÚMULA OFICIAL DE JOGO", (PAGE_LEFT + PAGE_RIGHT) / 2, 21, { align: "center" });

  doc.setDrawColor(160);
  doc.line(PAGE_LEFT, 23.5, PAGE_RIGHT, 23.5);

  const formattedDate = game.date
    ? new Date(game.date).toLocaleDateString("pt-BR")
    : null;
  const formattedTime = game.date
    ? new Date(game.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  const row1Y = 26;
  const rowH = 9;
  const col1W = 61;
  const col2W = 61;
  const col3W = PAGE_RIGHT - PAGE_LEFT - col1W - col2W;
  drawInfoBox(doc, PAGE_LEFT, row1Y, col1W, rowH, "DATA", formattedDate ?? "—");
  drawInfoBox(doc, PAGE_LEFT + col1W, row1Y, col2W, rowH, "HORÁRIO", formattedTime ?? "—");
  drawInfoBox(doc, PAGE_LEFT + col1W + col2W, row1Y, col3W, rowH, "FASE", game.round ?? "—");

  const row2Y = row1Y + rowH;
  const halfBoxW = (PAGE_RIGHT - PAGE_LEFT) / 2;
  drawInfoBox(doc, PAGE_LEFT, row2Y, halfBoxW, rowH, "LOCAL", championship.arenaName ?? game.venueName ?? "—");
  drawInfoBox(doc, PAGE_LEFT + halfBoxW, row2Y, halfBoxW, rowH, "CIDADE", championship.city ?? "—");

  const crestSize = 11;
  const scoreY = row2Y + rowH + 8;
  drawCrest(doc, game.teamACrestDataUrl, PAGE_LEFT, scoreY - 8, crestSize);
  drawCrest(doc, game.teamBCrestDataUrl, PAGE_RIGHT - crestSize, scoreY - 8, crestSize);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    `${game.teamAName}  ${game.scoreA ?? 0} x ${game.scoreB ?? 0}  ${game.teamBName}`,
    (PAGE_LEFT + PAGE_RIGHT) / 2,
    scoreY,
    { align: "center" }
  );
  doc.setFont("helvetica", "normal");

  const tableStartY = scoreY + 8;
  const tableGap = 6;
  const tableW = (PAGE_RIGHT - PAGE_LEFT - tableGap) / 2;
  const tableStyles = { fontSize: 7, cellPadding: 1 };
  const tableColumnStyles = {
    1: { cellWidth: 12, halign: "center" as const },
    2: { cellWidth: 16, halign: "center" as const },
    3: { cellWidth: 16, halign: "center" as const },
  };

  drawTable(doc, {
    startY: tableStartY,
    margin: { left: PAGE_LEFT },
    tableWidth: tableW,
    head: [[game.teamAName, "Gols", "Amarelo", "Vermelho"]],
    body: teamRows(game.teamAPlayers, game.goalEvents, game.cardEvents),
    styles: tableStyles,
    headStyles: tableStyles,
    columnStyles: tableColumnStyles,
  });

  drawTable(doc, {
    startY: tableStartY,
    margin: { left: PAGE_LEFT + tableW + tableGap },
    tableWidth: tableW,
    head: [[game.teamBName, "Gols", "Amarelo", "Vermelho"]],
    body: teamRows(game.teamBPlayers, game.goalEvents, game.cardEvents),
    styles: tableStyles,
    headStyles: tableStyles,
    columnStyles: tableColumnStyles,
  });
}
