"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { sortearGrupos, type SorteioReveal } from "./actions";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível sortear os grupos.";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const REVEAL_DELAY_MS = 700;

export function SortearGruposButton({ championshipId }: { championshipId: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "drawing" | "done">("idle");
  const [revealed, setRevealed] = useState<SorteioReveal[]>([]);
  const [groupOrder, setGroupOrder] = useState<string[]>([]);

  async function startDraw() {
    if (
      !window.confirm(
        "Sortear os grupos agora vai substituir o grupo de todos os times cadastrados. Continuar?"
      )
    ) {
      return;
    }

    let result: SorteioReveal[];
    try {
      result = await sortearGrupos(championshipId);
    } catch (error) {
      alert(errorMessage(error));
      return;
    }

    const groups = [...new Set(result.map((r) => r.groupName))].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
    setGroupOrder(groups);
    setRevealed([]);
    setPhase("drawing");

    for (const entry of result) {
      await sleep(REVEAL_DELAY_MS);
      setRevealed((prev) => [...prev, entry]);
    }

    setPhase("done");
  }

  function close() {
    setPhase("idle");
    setRevealed([]);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={startDraw}>
        Sortear grupos
      </Button>

      {phase !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground">
                {phase === "drawing" ? "Sorteando os grupos..." : "Sorteio concluído!"}
              </h2>
              {phase === "done" && (
                <Button type="button" onClick={close}>
                  Fechar
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {groupOrder.map((groupName) => {
                const teamsInGroup = revealed.filter((r) => r.groupName === groupName);
                return (
                  <div
                    key={groupName}
                    className="rounded-lg border border-border bg-surface-2/60 p-4"
                  >
                    <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-accent">
                      {groupName}
                    </h3>
                    {teamsInGroup.length === 0 ? (
                      <p className="text-sm text-muted">Aguardando...</p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {teamsInGroup.map((entry) => (
                          <li
                            key={entry.teamId}
                            className="rounded-md bg-surface px-3 py-1.5 text-sm font-medium text-foreground"
                          >
                            {entry.teamName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
