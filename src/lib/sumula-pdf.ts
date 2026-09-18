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

/** Cabeçalho do campeonato, repetido em toda súmula (logo + nome, edição,
 * cidade). `logoDataUrl` já vem convertido — ver `loadImageAsDataUrl`. */
export type SumulaPdfChampionship = {
  name: string;
  edition?: string | null;
  city?: string | null;
  logoDataUrl?: string | null;
};

/** Baixa uma imagem (ex.: logo do campeonato) e converte pra data URL,
 * formato que o jsPDF entende via `addImage`. Retorna null se falhar —
 * a súmula é gerada normalmente sem a logo nesse caso. */
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

/**
 * Desenha uma súmula (cabeçalho do campeonato + placar/fase + tabela de
 * cada time) a partir do topo da página atual do documento. Compartilhado
 * entre o botão de baixar uma súmula e o de baixar várias juntas num PDF
 * só (uma por página, cada uma com o mesmo cabeçalho).
 */
export function drawSumulaSection(
  doc: jsPDF,
  drawTable: typeof autoTable,
  game: SumulaPdfGameData,
  championship: SumulaPdfChampionship
) {
  const logoSize = 18;
  const hasLogo = Boolean(championship.logoDataUrl);
  const textX = hasLogo ? 14 + logoSize + 4 : 14;

  if (championship.logoDataUrl) {
    try {
      doc.addImage(
        championship.logoDataUrl,
        imageFormatFromDataUrl(championship.logoDataUrl),
        14,
        8,
        logoSize,
        logoSize
      );
    } catch {
      // Segue sem a logo se a imagem não puder ser processada.
    }
  }

  doc.setFontSize(14);
  doc.text(championship.name, textX, 16);

  let headerY = 16;
  doc.setFontSize(9);
  if (championship.edition) {
    headerY += 5;
    doc.text(championship.edition, textX, headerY);
  }
  if (championship.city) {
    headerY += 5;
    doc.text(championship.city, textX, headerY);
  }

  const headerBottom = Math.max(8 + logoSize, headerY) + 6;

  const formattedDate = game.date
    ? new Date(game.date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
    : null;
  const phase = game.round ? `Fase: ${game.round}` : null;
  const subtitle = [phase, formattedDate].filter(Boolean).join(" · ");

  doc.setFontSize(16);
  doc.text(
    `${game.teamAName} ${game.scoreA ?? 0} x ${game.scoreB ?? 0} ${game.teamBName}`,
    14,
    headerBottom + 8
  );
  let scoreBlockY = headerBottom + 8;
  if (subtitle) {
    doc.setFontSize(10);
    doc.text(subtitle, 14, headerBottom + 15);
    scoreBlockY = headerBottom + 15;
  }

  drawTable(doc, {
    startY: scoreBlockY + 5,
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
