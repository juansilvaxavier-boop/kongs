"use client";

import { useEffect, useState } from "react";
import { Badge, Card } from "@/components/ui";
import { PlayerCard } from "@/components/player-card";
import { ExportImageButton } from "@/components/export-image-button";
import { ShareStoryButton } from "@/components/share-story-button";
import { computeOvrEvolution } from "@/lib/ovr-evolution";
import type { Achievement } from "@/lib/achievements";
import { computeRarity, type PlayerAttributes as Attributes, type Rarity } from "@/lib/gamification";
import { OvrEvolutionChart } from "./ovr-chart";

const RARITY_ORDER: Record<Rarity, number> = { bronze: 0, prata: 1, ouro: 2, legend: 3 };
const RARITY_LABEL: Record<Rarity, string> = {
  bronze: "Bronze",
  prata: "Prata",
  ouro: "Ouro",
  legend: "Legend",
};
const RARITY_RING: Record<Rarity, string> = {
  bronze: "bg-[#a2652f]",
  prata: "bg-[#c8d2dc]",
  ouro: "bg-[#dcab35]",
  legend: "bg-[#c9a94e]",
};
const RARITY_GLOW: Record<Rarity, string> = {
  bronze: "shadow-[0_0_50px_16px_rgba(162,101,47,0.55)]",
  prata: "shadow-[0_0_50px_16px_rgba(200,210,220,0.55)]",
  ouro: "shadow-[0_0_50px_16px_rgba(220,171,53,0.6)]",
  legend: "shadow-[0_0_50px_16px_rgba(201,169,78,0.7)]",
};

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
  const [celebrating, setCelebrating] = useState(false);
  const evolutionPoints = computeOvrEvolution(history, attributes.ovr);

  const currentRarity = computeRarity(attributes.ovr);
  const previousOvr =
    evolutionPoints.length >= 2 ? evolutionPoints[evolutionPoints.length - 2].ovr : attributes.ovr;
  const rankedUp = RARITY_ORDER[currentRarity] > RARITY_ORDER[computeRarity(previousOvr)];

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 550);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!revealed || !rankedUp) return;
    const showTimer = setTimeout(() => setCelebrating(true), 0);
    const hideTimer = setTimeout(() => setCelebrating(false), 2600);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [revealed, rankedUp]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-sm flex-col items-center gap-4 overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative">
          {celebrating && (
            <>
              <span
                className={`pointer-events-none absolute inset-0 animate-ping rounded-full opacity-30 ${RARITY_RING[currentRarity]}`}
              />
              <p className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 animate-bounce whitespace-nowrap rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
                🎉 Subiu para {RARITY_LABEL[currentRarity]}!
              </p>
            </>
          )}
          <div
            id={`player-card-export-${name}`}
            className={`bg-background p-3 transition-all duration-700 ease-out ${
              revealed ? "rotate-0 scale-100 opacity-100" : "scale-75 rotate-6 opacity-0"
            } ${celebrating ? RARITY_GLOW[currentRarity] : ""}`}
          >
            <div id={`player-card-story-${name}`} className="inline-block">
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
          </div>
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
                <ShareStoryButton
                  targetId={`player-card-story-${name}`}
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
