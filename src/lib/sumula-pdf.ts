import type { jsPDF } from "jspdf";
import type autoTable from "jspdf-autotable";

export type SumulaPdfPlayer = { id: string; name: string; team_id: string | null };
export type SumulaPdfGoalEvent = { player_id: string; minute: number | null };
export type SumulaPdfCardEvent = { player_id: string; card_type: string; minute: number | null };

export type SumulaPdfGameData = {
  round?: string | null;
  date?: string | null;
  teamAName: string;
  teamBName: string;
  scoreA: number | null;
  scoreB: number | null;
  teamAPlayers: SumulaPdfPlayer[];
  teamBPlayers: SumulaPdfPlayer[];
  goalEvents: SumulaPdfGoalEvent[];
  cardEvents: SumulaPdfCardEvent[];
};

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

/**
 * Desenha uma súmula (cabeçalho + tabela de cada time) a partir do topo
 * da página atual do documento. Compartilhado entre o botão de baixar
 * uma súmula e o de baixar várias juntas num PDF só (uma por página).
 */
export function drawSumulaSection(doc: jsPDF, drawTable: typeof autoTable, game: SumulaPdfGameData) {
  const formattedDate = game.date
    ? new Date(game.date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : null;
  const subtitle = [game.round, formattedDate].filter(Boolean).join(" · ");

  doc.setFontSize(16);
  doc.text(`${game.teamAName} ${game.scoreA ?? 0} x ${game.scoreB ?? 0} ${game.teamBName}`, 14, 18);
  if (subtitle) {
    doc.setFontSize(10);
    doc.text(subtitle, 14, 25);
  }

  drawTable(doc, {
    startY: subtitle ? 30 : 24,
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
