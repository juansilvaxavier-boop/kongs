"use client";

import { useState } from "react";
import { useToast } from "./toast-provider";
import { Button } from "./ui";
import { composeInstagramStoryImage } from "@/lib/instagram-story";

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
