"use client";

import { useState } from "react";
import { useToast } from "./toast-provider";
import { Button } from "./ui";

export function ExportPdfButton({
  fileName,
  title,
  columns,
  rows,
}: {
  fileName: string;
  title: string;
  columns: string[];
  rows: (string | number)[][];
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
          doc.text(title, 14, 18);
          autoTable(doc, {
            startY: 24,
            head: [columns],
            body: rows,
          });
          doc.save(`${fileName}.pdf`);
        } catch {
          toast.error("Não foi possível gerar o PDF. Tente novamente.");
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Gerando..." : "Baixar PDF"}
    </Button>
  );
}
