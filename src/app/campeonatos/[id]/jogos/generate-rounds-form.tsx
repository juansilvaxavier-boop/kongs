"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import { generateRounds, type GeneratedGamePreview } from "./actions";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação.";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const REVEAL_DELAY_MS = 400;

function gamesForPool(poolSize: number, rounds: number) {
  const roundsCount = poolSize % 2 === 0 ? poolSize - 1 : poolSize;
  const gamesPerRound = Math.floor(poolSize / 2);
  return roundsCount * gamesPerRound * rounds;
}

export function GenerateRoundsForm({
  championshipId,
  poolSizes,
}: {
  championshipId: string;
  poolSizes: number[];
}) {
  const router = useRouter();
  const [rounds, setRounds] = useState(1);
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState<"idle" | "drawing" | "done">("idle");
  const [revealed, setRevealed] = useState<GeneratedGamePreview[]>([]);
  const fullPreviewRef = useRef<GeneratedGamePreview[]>([]);
  const skippedRef = useRef(false);

  const eligiblePools = poolSizes.filter((size) => size >= 2);
  const totalGames = eligiblePools.reduce(
    (sum, size) => sum + gamesForPool(size, rounds),
    0
  );

  async function handleGenerate() {
    if (
      !window.confirm(
        `Isso vai criar ${totalGames} jogos${
          poolSizes.length > 1 ? " (considerando os grupos)" : ""
        }. Continuar?`
      )
    ) {
      return;
    }

    setPending(true);
    let preview: GeneratedGamePreview[];
    try {
      const formData = new FormData();
      formData.set("rounds", String(rounds));
      preview = await generateRounds(championshipId, formData);
    } catch (error) {
      alert(errorMessage(error));
      setPending(false);
      return;
    }
    setPending(false);

    fullPreviewRef.current = preview;
    skippedRef.current = false;
    setRevealed([]);
    setPhase("drawing");

    for (const game of preview) {
      if (skippedRef.current) break;
      await sleep(REVEAL_DELAY_MS);
      setRevealed((prev) => [...prev, game]);
    }
    setPhase("done");
  }

  function skipToEnd() {
    skippedRef.current = true;
    setRevealed(fullPreviewRef.current);
    setPhase("done");
  }

  function close() {
    setPhase("idle");
    setRevealed([]);
    router.refresh();
  }

  return (
    <>
      <Card className="mb-6 p-5">
        <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-foreground">
          Gerar rodadas automaticamente
        </h2>
        <p className="mb-4 text-sm text-muted">
          Cria os confrontos de todos os times entre si (todos x todos), dentro
          de cada grupo quando o formato for Copa. As datas ficam em branco —
          edite depois em cada jogo.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-56">
            <Label>Jogos por adversário no grupo</Label>
            <Input
              type="number"
              min={1}
              value={rounds}
              onChange={(e) => setRounds(Math.max(1, Number(e.target.value) || 1))}
            />
            <p className="mt-1 text-xs text-muted">
              1 = turno único, 2 = ida e volta, 3+ = turnos extras
            </p>
          </div>
          <Button type="button" disabled={pending} onClick={handleGenerate}>
            {pending ? "Gerando..." : `Gerar ${totalGames} jogos`}
          </Button>
        </div>
      </Card>

      {phase !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="flex max-h-[85vh] w-full max-w-lg flex-col p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
                {phase === "drawing" ? "Sorteando os jogos..." : "Sorteio concluído!"}
              </h2>
              {phase === "drawing" ? (
                <button
                  type="button"
                  onClick={skipToEnd}
                  className="text-xs text-muted underline hover:text-foreground"
                >
                  Pular
                </button>
              ) : (
                <Button type="button" onClick={close}>
                  Fechar
                </Button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {revealed.length === 0 ? (
                <p className="text-sm text-muted">Aguardando...</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {revealed.map((game, index) => (
                    <li
                      key={index}
                      className="rounded-md bg-surface-2/60 px-3 py-2 text-sm"
                    >
                      <span className="text-xs uppercase tracking-wide text-muted">
                        {game.round}
                      </span>
                      <p className="font-medium text-foreground">
                        {game.teamAName} x {game.teamBName}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
