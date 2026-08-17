"use client";

import { useState } from "react";
import { useToast } from "./toast-provider";
import { Button } from "./ui";
import { composeInstagramStoryImage } from "@/lib/instagram-story";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function ShareStoryButton({
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
        setPending(true);
        try {
          const blob = await composeInstagramStoryImage(targetId);

          if (isIOS() && navigator.clipboard && typeof ClipboardItem !== "undefined") {
            try {
              await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
              window.location.href = "instagram-stories://share?source_application=kongsleague";
              toast.info("Abra o Instagram: a arte já está pronta para colar nos stories.");
              return;
            } catch {
              // Sem permissão de clipboard ou Instagram não instalado — segue para os outros métodos.
            }
          }

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
