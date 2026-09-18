"use client";

import { useState } from "react";
import { useToast } from "./toast-provider";
import { Button } from "./ui";
import { drawSumulaSection, type SumulaPdfGameData } from "@/lib/sumula-pdf";

export type BulkSumulaGame = SumulaPdfGameData & { id: string; played: boolean };

export function BulkSumulaPdfButton({ games }: { games: BulkSumulaGame[] }) {
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
      const doc = new jsPDF();
      selected.forEach((game, index) => {
        if (index > 0) doc.addPage();
        drawSumulaSection(doc, autoTable, game);
      });
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
