"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { sortearGrupos } from "./actions";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível sortear os grupos.";
}

export function SortearGruposButton({ championshipId }: { championshipId: string }) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={pending}
      onClick={async () => {
        if (
          !window.confirm(
            "Sortear os grupos agora vai substituir o grupo de todos os times cadastrados. Continuar?"
          )
        ) {
          return;
        }
        setPending(true);
        try {
          await sortearGrupos(championshipId);
        } catch (error) {
          alert(errorMessage(error));
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? "Sorteando..." : "Sortear grupos"}
    </Button>
  );
}
