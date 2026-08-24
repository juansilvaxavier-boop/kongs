"use client";

import { useState } from "react";
import { useToast } from "./toast-provider";
import { Button } from "./ui";

type Player = { id: string; name: string; team_id: string | null };
type GoalEvent = { player_id: string; minute: number | null };
type CardEvent = { player_id: string; card_type: string; minute: number | null };

function teamRows(teamPlayers: Player[], goalEvents: GoalEvent[], cardEvents: CardEvent[]) {
  return teamPlayers.map((player) => [
    player.name,
    goalEvents.filter((g) => g.player_id === player.id).length,
    cardEvents.filter((c) => c.player_id === player.id && c.card_type === "yellow").length,
    cardEvents.filter((c) => c.player_id === player.id && c.card_type === "red").length,
  ]);
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
  const toast = useToast();

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
            head: [[teamAName, "Gols", "Cartão amarelo", "Cartão vermelho"]],
            body: teamRows(teamAPlayers, goalEvents, cardEvents),
          });

          const afterTeamA = (doc as unknown as { lastAutoTable: { finalY: number } })
            .lastAutoTable.finalY;

          autoTable(doc, {
            startY: afterTeamA + 8,
            head: [[teamBName, "Gols", "Cartão amarelo", "Cartão vermelho"]],
            body: teamRows(teamBPlayers, goalEvents, cardEvents),
          });

          doc.save(`sumula-${teamAName}-x-${teamBName}.pdf`);
        } catch {
          toast.error("Não foi possível gerar o PDF. Tente novamente.");
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Gerando..." : "Baixar súmula (PDF)"}
    </Button>
  );
}
