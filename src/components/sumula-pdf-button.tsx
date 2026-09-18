"use client";

import { useState } from "react";
import { useToast } from "./toast-provider";
import { Button } from "./ui";
import { drawSumulaSection, type SumulaPdfGameData } from "@/lib/sumula-pdf";

export function SumulaPdfButton(props: SumulaPdfGameData) {
  const { teamAName, teamBName } = props;
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
          drawSumulaSection(doc, autoTable, props);
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
