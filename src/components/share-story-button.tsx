"use client";

import { useState } from "react";
import { useToast } from "./toast-provider";
import { Button } from "./ui";
import { composeInstagramStoryImage } from "@/lib/instagram-story";
import type { PlayerAttributes } from "@/lib/gamification";

function resolveFontFamily(selector: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const el = document.querySelector(selector);
  if (!el) return fallback;
  const family = window.getComputedStyle(el).fontFamily;
  return family || fallback;
}

export function ShareStoryButton({
  fileName,
  name,
  position,
  number,
  photoUrl,
  crestUrl,
  attributes,
}: {
  fileName: string;
  name: string;
  position: string | null;
  number?: number | null;
  photoUrl?: string | null;
  crestUrl?: string | null;
  attributes: PlayerAttributes;
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
          const blob = await composeInstagramStoryImage({
            name,
            position,
            number,
            photoUrl,
            crestUrl,
            attributes,
            displayFontFamily: resolveFontFamily(".font-display", "sans-serif"),
            bodyFontFamily: resolveFontFamily("body", "sans-serif"),
          });
          const file = new File([blob], `${fileName}.png`, { type: "image/png" });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file] });
            return;
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = `${fileName}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          toast.info("Imagem baixada. Abra o Instagram e poste nos stories.");
        } catch {
          toast.error("Não foi possível compartilhar a cartinha. Tente novamente.");
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Preparando..." : "Compartilhar no Stories"}
    </Button>
  );
}
