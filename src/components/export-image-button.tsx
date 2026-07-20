"use client";

import { useState } from "react";
import { useToast } from "./toast-provider";
import { Button } from "./ui";

export function ExportImageButton({
  targetId,
  fileName,
}: {
  targetId: string;
  fileName: string;
}) {
  const [pending, setPending] = useState(false);
  const toast = useToast();

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={async () => {
        const el = document.getElementById(targetId);
        if (!el) {
          toast.error("Não foi possível encontrar o conteúdo para exportar.");
          return;
        }

        setPending(true);
        try {
          const { default: html2canvas } = await import("html2canvas-pro");
          const canvas = await html2canvas(el, { backgroundColor: "#faf9fb" });
          const link = document.createElement("a");
          link.download = `${fileName}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        } catch {
          toast.error("Não foi possível gerar a imagem. Tente novamente.");
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Gerando..." : "Baixar imagem"}
    </Button>
  );
}
