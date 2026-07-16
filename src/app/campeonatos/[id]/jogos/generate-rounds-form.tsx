"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { generateRounds } from "./actions";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação.";
}

export function GenerateRoundsForm({
  championshipId,
  teamCount,
}: {
  championshipId: string;
  teamCount: number;
}) {
  const [doubleRound, setDoubleRound] = useState(false);
  const [pending, setPending] = useState(false);

  const rounds = teamCount % 2 === 0 ? teamCount - 1 : teamCount;
  const gamesPerRound = Math.floor(teamCount / 2);
  const totalGames = rounds * gamesPerRound * (doubleRound ? 2 : 1);

  return (
    <Card className="mb-6 p-5">
      <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-foreground">
        Gerar rodadas automaticamente
      </h2>
      <p className="mb-4 text-sm text-muted">
        Cria os confrontos de todos os times entre si (todos x todos). As
        datas ficam em branco — edite depois em cada jogo.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={doubleRound}
            onChange={(e) => setDoubleRound(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          Turno e returno (ida e volta)
        </label>
        <Button
          type="button"
          disabled={pending}
          onClick={async () => {
            if (
              !window.confirm(
                `Isso vai criar ${totalGames} jogos em ${rounds * (doubleRound ? 2 : 1)} rodadas. Continuar?`
              )
            ) {
              return;
            }
            setPending(true);
            try {
              const formData = new FormData();
              if (doubleRound) formData.set("double_round", "on");
              await generateRounds(championshipId, formData);
            } catch (error) {
              alert(errorMessage(error));
            } finally {
              setPending(false);
            }
          }}
        >
          {pending ? "Gerando..." : `Gerar ${totalGames} jogos`}
        </Button>
      </div>
    </Card>
  );
}
