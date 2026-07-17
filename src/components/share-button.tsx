"use client";

import { useState } from "react";
import { Button } from "./ui";

export function ShareButton({ title }: { title: string }) {
  const [label, setLabel] = useState("Compartilhar");

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
          alert(url);
        }
      }}
    >
      {label}
    </Button>
  );
}
