"use client";

import { useState } from "react";
import { Button, Card } from "./ui";
import { useToast } from "./toast-provider";
import type { ActionResult } from "@/lib/action-result";

export function TiebreakWinnerPanel({
  teamAId,
  teamAName,
  teamBId,
  teamBName,
  winnerTeamId,
  onSave,
}: {
  teamAId: string;
  teamAName: string;
  teamBId: string;
  teamBName: string;
  winnerTeamId: string | null;
  onSave: (winnerTeamId: string | null) => Promise<ActionResult>;
}) {
  const [pending, setPending] = useState(false);
  const toast = useToast();

  async function choose(teamId: string | null) {
    setPending(true);
    const result = await onSave(teamId);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(teamId ? "Time classificado escolhido." : "Escolha removida.");
  }

  return (
    <Card className="mb-4 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          Jogo empatado no mata-mata — se não teve disputa de pênaltis, escolha direto quem avança.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={winnerTeamId === teamAId ? "primary" : "secondary"}
            disabled={pending}
            onClick={() => choose(teamAId)}
          >
            {teamAName} avança
          </Button>
          <Button
            type="button"
            variant={winnerTeamId === teamBId ? "primary" : "secondary"}
            disabled={pending}
            onClick={() => choose(teamBId)}
          >
            {teamBName} avança
          </Button>
          {winnerTeamId && (
            <Button type="button" variant="ghost" disabled={pending} onClick={() => choose(null)}>
              Limpar escolha
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
