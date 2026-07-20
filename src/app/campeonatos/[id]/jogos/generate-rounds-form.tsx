"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { generateRoundRobinForTotalRounds } from "@/lib/round-robin";
import { generateRounds, type GeneratedGamePreview } from "./actions";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const REVEAL_DELAY_MS = 400;

function previewFixtures(poolSize: number, totalRounds: number) {
  const dummyIds = Array.from({ length: poolSize }, (_, i) => String(i));
  return generateRoundRobinForTotalRounds(dummyIds, totalRounds);
}

function gamesPerTeamRange(poolSize: number, totalRounds: number) {
  const fixtures = previewFixtures(poolSize, totalRounds);
  const counts = new Map<string, number>();
  for (const f of fixtures) {
    counts.set(f.teamAId, (counts.get(f.teamAId) ?? 0) + 1);
    counts.set(f.teamBId, (counts.get(f.teamBId) ?? 0) + 1);
  }
  const values = [...counts.values()];
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `${min}` : `${min}-${max}`;
}

export function GenerateRoundsForm({
  championshipId,
  poolSizes,
}: {
  championshipId: string;
  poolSizes: number[];
}) {
  const router = useRouter();
  const [totalRounds, setTotalRounds] = useState(1);
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState<"idle" | "drawing" | "done">("idle");
  const [revealed, setRevealed] = useState<GeneratedGamePreview[]>([]);
  const fullPreviewRef = useRef<GeneratedGamePreview[]>([]);
  const skippedRef = useRef(false);
  const confirm = useConfirm();
  const toast = useToast();

  const eligiblePools = poolSizes.filter((size) => size >= 2);
  const totalGames = eligiblePools.reduce(
    (sum, size) => sum + previewFixtures(size, totalRounds).length,
    0
  );
  const gamesPerTeamByPoolSize = [...new Set(eligiblePools)]
    .sort((a, b) => a - b)
    .map((size) => ({ size, gamesPerTeam: gamesPerTeamRange(size, totalRounds) }));

  async function handleGenerate() {
    const ok = await confirm({
      title: "Gerar as rodadas?",
      description: `Isso vai criar ${totalGames} jogos em ${totalRounds} rodada(s).`,
      confirmLabel: "Gerar",
    });
    if (!ok) {
      return;
    }

    setPending(true);
    const formData = new FormData();
    formData.set("rounds", String(totalRounds));
    const result = await generateRounds(championshipId, formData);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const preview = result.data;

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
            <Label>Quantas rodadas terá a fase de grupos</Label>
            <Input
              type="number"
              min={1}
              value={totalRounds}
              onChange={(e) =>
                setTotalRounds(Math.max(1, Number(e.target.value) || 1))
              }
            />
            <p className="mt-1 text-xs text-muted">
              Se não der para todos se enfrentarem uma vez só nessa quantidade
              de rodadas, o sorteio completa turnos extras (ida e volta, etc.)
              automaticamente.
            </p>
          </div>
          <Button type="button" disabled={pending} onClick={handleGenerate}>
            {pending ? "Gerando..." : `Gerar ${totalGames} jogos`}
          </Button>
        </div>
        {gamesPerTeamByPoolSize.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            {gamesPerTeamByPoolSize
              .map(({ size, gamesPerTeam }) =>
                gamesPerTeamByPoolSize.length > 1
                  ? `grupo de ${size} times: ${gamesPerTeam} jogos por time`
                  : `cada time jogará ${gamesPerTeam} jogos`
              )
              .join(" · ")}
            . O sorteio decide aleatoriamente a ordem das rodadas.
          </p>
        )}
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
