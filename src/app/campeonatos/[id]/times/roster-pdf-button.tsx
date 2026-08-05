"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { useToast } from "@/components/toast-provider";
import { loadImageAsPngDataUrl } from "@/lib/pdf-image";

const DOCUMENT_LABELS: Record<string, string> = { cpf: "CPF", rg: "RG" };

type RosterPlayer = {
  name: string;
  position: string | null;
  birth_date: string | null;
  document_type: string | null;
  document_number: string | null;
};

function formatBirthDate(birthDate: string | null) {
  if (!birthDate) return "—";
  return new Date(`${birthDate}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatDocument(player: RosterPlayer) {
  if (!player.document_type || !player.document_number) return "—";
  const label = DOCUMENT_LABELS[player.document_type] ?? player.document_type;
  return `${label}: ${player.document_number}`;
}

export function RosterPdfButton({
  teamName,
  crestUrl,
  coachName,
  players,
}: {
  teamName: string;
  crestUrl: string | null;
  coachName: string | null;
  players: RosterPlayer[];
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

          const logoDataUrl = crestUrl ? await loadImageAsPngDataUrl(crestUrl) : null;
          const textX = logoDataUrl ? 40 : 14;

          if (logoDataUrl) {
            doc.addImage(logoDataUrl, "PNG", 14, 10, 20, 20);
          }

          doc.setFontSize(16);
          doc.text(teamName, textX, 20);
          doc.setFontSize(10);
          doc.text(`Técnico: ${coachName ?? "—"}`, textX, 27);
          doc.text(`Baixado em: ${new Date().toLocaleString("pt-BR")}`, textX, 33);

          autoTable(doc, {
            startY: 40,
            head: [["Nome", "Posição", "Data de nascimento", "Documento"]],
            body: players.map((player) => [
              player.name,
              player.position ?? "—",
              formatBirthDate(player.birth_date),
              formatDocument(player),
            ]),
          });

          doc.save(`elenco-${teamName}.pdf`);
        } catch {
          toast.error("Não foi possível gerar o PDF. Tente novamente.");
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Gerando..." : "Baixar elenco (PDF)"}
    </Button>
  );
}
