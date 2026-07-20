"use client";

import { useEffect, useState } from "react";
import { Badge, Card } from "@/components/ui";
import { PlayerCard } from "@/components/player-card";
import { ExportImageButton } from "@/components/export-image-button";
import { computeOvrEvolution } from "@/lib/ovr-evolution";
import type { Achievement } from "@/lib/achievements";
import type { PlayerAttributes as Attributes } from "@/lib/gamification";
import { OvrEvolutionChart } from "./ovr-chart";

const ACHIEVEMENT_STYLES: Record<string, string> = {
  artilheiro: "border-amber-400/60 bg-amber-400/10 text-amber-500",
  "hat-trick": "border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-500",
  "craque-do-jogo": "border-sky-400/60 bg-sky-400/10 text-sky-500",
  "fair-play": "border-emerald-400/60 bg-emerald-400/10 text-emerald-500",
  lenda: "border-yellow-300/60 bg-yellow-300/10 text-yellow-500",
  muralha: "border-slate-400/60 bg-slate-400/10 text-slate-400",
  "camisa-10": "border-orange-400/60 bg-orange-400/10 text-orange-500",
  default: "border-border bg-surface-2 text-foreground",
};

export type HistoryEntry = {
  id: string;
  round: string | null;
  reason: string;
  delta: number;
  created_at: string;
};

export function PlayerCardModal({
  name,
  position,
  number,
  photoUrl,
  crestUrl,
  attributes,
  history,
  mvpCount,
  achievements,
  onClose,
}: {
  name: string;
  position: string | null;
  number: number | null;
  photoUrl: string | null;
  crestUrl?: string | null;
  attributes: Attributes;
  history: HistoryEntry[];
  mvpCount: number;
  achievements: Achievement[];
  onClose: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const evolutionPoints = computeOvrEvolution(history, attributes.ovr);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 550);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-sm flex-col items-center gap-4 overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          id={`player-card-export-${name}`}
          className={`bg-background p-3 transition-all duration-700 ease-out ${
            revealed ? "rotate-0 scale-100 opacity-100" : "scale-75 rotate-6 opacity-0"
          }`}
        >
          <PlayerCard
            name={name}
            position={position}
            number={number}
            photoUrl={photoUrl}
            crestUrl={crestUrl}
            attributes={attributes}
            size="lg"
          />
        </div>

        {revealed && (
          <Card className="w-full p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
                Evolução de OVR
              </h3>
              <div className="flex items-center gap-2">
                {mvpCount > 0 && (
                  <Badge tone="success">
                    {mvpCount === 1 ? "MVP em 1 jogo" : `MVP em ${mvpCount} jogos`}
                  </Badge>
                )}
                <ExportImageButton
                  targetId={`player-card-export-${name}`}
                  fileName={`carta-${name}`}
                />
              </div>
            </div>

            {achievements.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {achievements.map((achievement) => (
                  <span
                    key={achievement.id}
                    title={achievement.description}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm transition hover:-translate-y-0.5 ${
                      ACHIEVEMENT_STYLES[achievement.id] ?? ACHIEVEMENT_STYLES.default
                    }`}
                  >
                    <span className="text-sm leading-none">{achievement.icon}</span>
                    {achievement.label}
                  </span>
                ))}
              </div>
            )}

            {history.length > 0 && <OvrEvolutionChart points={evolutionPoints} />}

            {history.length === 0 ? (
              <p className="text-sm text-muted">
                Ainda sem histórico — a carta evolui conforme os jogos são registrados na súmula.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-surface-2/60 px-3 py-1.5"
                  >
                    <span className="text-foreground">
                      {entry.reason}
                      {entry.round ? (
                        <span className="text-muted"> · {entry.round}</span>
                      ) : null}
                    </span>
                    <span
                      className={`font-display font-semibold ${
                        entry.delta >= 0 ? "text-accent" : "text-danger"
                      }`}
                    >
                      {entry.delta >= 0 ? "+" : ""}
                      {entry.delta.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
