"use client";

import { useState } from "react";
import { Button } from "./ui";

type Player = { id: string; name: string; team_id: string | null };
type GoalEvent = { player_id: string; minute: number | null };
type CardEvent = { player_id: string; card_type: string; minute: number | null };

function teamRows(teamPlayers: Player[], goalEvents: GoalEvent[], cardEvents: CardEvent[]) {
  const playerIds = new Set(teamPlayers.map((p) => p.id));
  const playerName = (id: string) => teamPlayers.find((p) => p.id === id)?.name ?? "?";
  const rows: (string | number)[][] = [];
  for (const goal of goalEvents.filter((g) => playerIds.has(g.player_id))) {
    rows.push([playerName(goal.player_id), "Gol", goal.minute !== null ? `${goal.minute}'` : "—"]);
  }
  for (const card of cardEvents.filter((c) => playerIds.has(c.player_id))) {
    rows.push([
      playerName(card.player_id),
      card.card_type === "red" ? "Cartão vermelho" : "Cartão amarelo",
      card.minute !== null ? `${card.minute}'` : "—",
    ]);
  }
  return rows;
}

export function SumulaPdfButton({
  round,
  teamAName,
  teamBName,
  scoreA,
  scoreB,
  teamAPlayers,
  teamBPlayers,
  goalEvents,
  cardEvents,
}: {
  round?: string | null;
  teamAName: string;
  teamBName: string;
  scoreA: number | null;
  scoreB: number | null;
  teamAPlayers: Player[];
  teamBPlayers: Player[];
  goalEvents: GoalEvent[];
  cardEvents: CardEvent[];
}) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const { jsPDF } = await import("jspdf");
          const { default: autoTable } = await import("jspdf-autotable");
          const doc = new jsPDF();

          doc.setFontSize(16);
          doc.text(`${teamAName} ${scoreA ?? 0} x ${scoreB ?? 0} ${teamBName}`, 14, 18);
          if (round) {
            doc.setFontSize(10);
            doc.text(round, 14, 25);
          }

          autoTable(doc, {
            startY: round ? 30 : 24,
            head: [[teamAName, "Evento", "Minuto"]],
            body: teamRows(teamAPlayers, goalEvents, cardEvents),
          });

          const afterTeamA = (doc as unknown as { lastAutoTable: { finalY: number } })
            .lastAutoTable.finalY;

          autoTable(doc, {
            startY: afterTeamA + 8,
            head: [[teamBName, "Evento", "Minuto"]],
            body: teamRows(teamBPlayers, goalEvents, cardEvents),
          });

          doc.save(`sumula-${teamAName}-x-${teamBName}.pdf`);
        } catch {
          alert("Não foi possível gerar o PDF. Tente novamente.");
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Gerando..." : "Baixar súmula (PDF)"}
    </Button>
  );
}
