"use client";

import { useState } from "react";
import { useToast } from "./toast-provider";
import { Button } from "./ui";
import {
  drawSumulaSection,
  loadImageAsDataUrl,
  type SumulaPdfGameData,
} from "@/lib/sumula-pdf";

export type BulkSumulaGame = Omit<SumulaPdfGameData, "teamACrestDataUrl" | "teamBCrestDataUrl"> & {
  id: string;
  played: boolean;
  teamACrestUrl?: string | null;
  teamBCrestUrl?: string | null;
};

export function BulkSumulaPdfButton({
  games,
  championshipName,
  championshipEdition,
  championshipCity,
  championshipArenaName,
  championshipLogoUrl,
}: {
  games: BulkSumulaGame[];
  championshipName: string;
  championshipEdition?: string | null;
  championshipCity?: string | null;
  championshipArenaName?: string | null;
  championshipLogoUrl?: string | null;
}) {
  const [pending, setPending] = useState<"all" | "played" | null>(null);
  const toast = useToast();

  async function generate(scope: "all" | "played") {
    const selected = scope === "played" ? games.filter((g) => g.played) : games;
    if (selected.length === 0) {
      toast.error(
        scope === "played" ? "Nenhum jogo realizado ainda." : "Nenhum jogo cadastrado neste campeonato."
      );
      return;
    }

    setPending(scope);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const imageCache = new Map<string, string | null>();
      async function resolveImage(url: string | null | undefined): Promise<string | null> {
        if (!url) return null;
        if (imageCache.has(url)) return imageCache.get(url) ?? null;
        const dataUrl = await loadImageAsDataUrl(url);
        imageCache.set(url, dataUrl);
        return dataUrl;
      }

      const logoDataUrl = await resolveImage(championshipLogoUrl);
      const championship = {
        name: championshipName,
        edition: championshipEdition,
        city: championshipCity,
        arenaName: championshipArenaName,
        logoDataUrl,
      };

      const doc = new jsPDF();
      for (let index = 0; index < selected.length; index++) {
        const { teamACrestUrl, teamBCrestUrl, ...game } = selected[index];
        const [teamACrestDataUrl, teamBCrestDataUrl] = await Promise.all([
          resolveImage(teamACrestUrl),
          resolveImage(teamBCrestUrl),
        ]);
        if (index > 0) doc.addPage();
        drawSumulaSection(doc, autoTable, { ...game, teamACrestDataUrl, teamBCrestDataUrl }, championship);
      }
      doc.save(scope === "played" ? "sumulas-realizadas.pdf" : "sumulas-todos-os-jogos.pdf");
    } catch {
      toast.error("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={pending !== null}
        onClick={() => generate("all")}
      >
        {pending === "all" ? "Gerando..." : "Baixar todas as súmulas"}
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={pending !== null}
        onClick={() => generate("played")}
      >
        {pending === "played" ? "Gerando..." : "Baixar súmulas realizadas"}
      </Button>
    </div>
  );
}
