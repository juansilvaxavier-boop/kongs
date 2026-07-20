"use client";

import { useState } from "react";
import { useToast } from "./toast-provider";
import { Button } from "./ui";

export function ShareButton({ title }: { title: string }) {
  const [label, setLabel] = useState("Compartilhar");
  const toast = useToast();

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
          } catch {
            // usuário cancelou o compartilhamento
          }
          return;
        }
        try {
          await navigator.clipboard.writeText(url);
          setLabel("Link copiado!");
          setTimeout(() => setLabel("Compartilhar"), 2000);
        } catch {
          toast.error(`Não foi possível copiar automaticamente. Link: ${url}`);
        }
      }}
    >
      {label}
    </Button>
  );
}
