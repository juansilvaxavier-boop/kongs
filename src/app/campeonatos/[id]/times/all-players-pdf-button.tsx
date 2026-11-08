"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/toast-provider";

const DOCUMENT_LABELS: Record<string, string> = { cpf: "CPF", rg: "RG" };

type Team = { id: string; name: string };
type Player = {
  name: string;
  team_id: string | null;
  number: number | null;
  position: string | null;
  document_type: string | null;
  document_number: string | null;
  birth_date: string | null;
};

function formatBirthDate(birthDate: string | null) {
  if (!birthDate) return "—";
  return new Date(`${birthDate}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatDocument(player: Player) {
  if (!player.document_type || !player.document_number) return "—";
  const label = DOCUMENT_LABELS[player.document_type] ?? player.document_type;
  return `${label}: ${player.document_number}`;
}

export function AllPlayersPdfButton({
  championshipName,
  teams,
  players,
}: {
  championshipName: string;
  teams: Team[];
  players: Player[];
}) {
  const [pending, setPending] = useState(false);
  const toast = useToast();

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending || players.length === 0}
      onClick={async () => {
        setPending(true);
        try {
          const { jsPDF } = await import("jspdf");
          const { default: autoTable } = await import("jspdf-autotable");
          const doc = new jsPDF();
          const pageHeight = doc.internal.pageSize.getHeight();

          doc.setFontSize(16);
          doc.text(`Jogadores — ${championshipName}`, 14, 18);
          doc.setFontSize(10);
          doc.text(
            `${players.length} jogador(es) cadastrado(s) · Baixado em: ${new Date().toLocaleString("pt-BR")}`,
            14,
            25
          );

          let y = 35;
          const groups = [
            ...teams.map((team) => ({
              label: team.name,
              teamPlayers: players.filter((p) => p.team_id === team.id),
            })),
            { label: "Sem time", teamPlayers: players.filter((p) => !p.team_id) },
          ].filter((group) => group.teamPlayers.length > 0);

          for (const group of groups) {
            if (y > pageHeight - 40) {
              doc.addPage();
              y = 20;
            }
            doc.setFontSize(12);
            doc.text(group.label, 14, y);
            y += 6;

            autoTable(doc, {
              startY: y,
              head: [["Nome", "Nº", "Posição", "Data de nascimento", "Documento"]],
              body: group.teamPlayers.map((player) => [
                player.name,
                player.number?.toString() ?? "—",
                player.position ?? "—",
                formatBirthDate(player.birth_date),
                formatDocument(player),
              ]),
              styles: { fontSize: 9 },
            });

            y =
              (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
          }

          doc.save(`jogadores-${championshipName}.pdf`);
        } catch {
          toast.error("Não foi possível gerar o PDF. Tente novamente.");
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Gerando..." : "Baixar todos os jogadores (PDF)"}
    </Button>
  );
}
