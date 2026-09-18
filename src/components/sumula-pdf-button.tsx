"use client";

import { useState } from "react";
import { useToast } from "./toast-provider";
import { Button } from "./ui";
import {
  drawSumulaSection,
  loadImageAsDataUrl,
  type SumulaPdfGameData,
} from "@/lib/sumula-pdf";

type Props = Omit<SumulaPdfGameData, "teamACrestDataUrl" | "teamBCrestDataUrl"> & {
  teamACrestUrl?: string | null;
  teamBCrestUrl?: string | null;
  championshipName: string;
  championshipEdition?: string | null;
  championshipCity?: string | null;
  championshipArenaName?: string | null;
  championshipLogoUrl?: string | null;
};

export function SumulaPdfButton({
  championshipName,
  championshipEdition,
  championshipCity,
  championshipArenaName,
  championshipLogoUrl,
  teamACrestUrl,
  teamBCrestUrl,
  ...game
}: Props) {
  const { teamAName, teamBName } = game;
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
          const [logoDataUrl, teamACrestDataUrl, teamBCrestDataUrl] = await Promise.all([
            championshipLogoUrl ? loadImageAsDataUrl(championshipLogoUrl) : null,
            teamACrestUrl ? loadImageAsDataUrl(teamACrestUrl) : null,
            teamBCrestUrl ? loadImageAsDataUrl(teamBCrestUrl) : null,
          ]);
          const doc = new jsPDF();
          drawSumulaSection(
            doc,
            autoTable,
            { ...game, teamACrestDataUrl, teamBCrestDataUrl },
            {
              name: championshipName,
              edition: championshipEdition,
              city: championshipCity,
              arenaName: championshipArenaName,
              logoDataUrl,
            }
          );
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
