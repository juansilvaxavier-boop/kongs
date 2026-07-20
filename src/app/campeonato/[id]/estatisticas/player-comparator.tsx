"use client";

import { useState } from "react";
import { Card, EmptyState, Select } from "@/components/ui";
import { PlayerCard } from "@/components/player-card";
import type { PlayerAttributes as Attributes } from "@/lib/gamification";

export type ComparablePlayer = {
  id: string;
  name: string;
  teamName: string;
  position: string | null;
  photoUrl: string | null;
  crestUrl: string | null;
  attributes: Attributes;
};

const ATTRIBUTE_ROWS: [keyof Attributes, string][] = [
  ["ovr", "OVR"],
  ["ritmo", "Ritmo"],
  ["finalizacao", "Finalização"],
  ["passe", "Passe"],
  ["drible", "Drible"],
  ["defesa", "Defesa"],
  ["fisico", "Físico"],
];

export function PlayerComparator({ players }: { players: ComparablePlayer[] }) {
  const [aId, setAId] = useState(players[0]?.id ?? "");
  const [bId, setBId] = useState(players[1]?.id ?? players[0]?.id ?? "");

  if (players.length < 2) {
    return <EmptyState>Cadastre ao menos dois jogadores para comparar.</EmptyState>;
  }

  const playerA = players.find((p) => p.id === aId) ?? players[0];
  const playerB = players.find((p) => p.id === bId) ?? players[1];

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-4">
        <Select value={playerA.id} onChange={(event) => setAId(event.target.value)}>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.teamName})
            </option>
          ))}
        </Select>
        <Select value={playerB.id} onChange={(event) => setBId(event.target.value)}>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.teamName})
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-5 flex flex-wrap items-start justify-center gap-6">
        <PlayerCard
          name={playerA.name}
          position={playerA.position}
          photoUrl={playerA.photoUrl}
          crestUrl={playerA.crestUrl}
          attributes={playerA.attributes}
          size="lg"
        />
        <PlayerCard
          name={playerB.name}
          position={playerB.position}
          photoUrl={playerB.photoUrl}
          crestUrl={playerB.crestUrl}
          attributes={playerB.attributes}
          size="lg"
        />
      </div>

      <Card className="mx-auto max-w-md overflow-hidden">
        {ATTRIBUTE_ROWS.map(([key, label]) => {
          const aValue = playerA.attributes[key];
          const bValue = playerB.attributes[key];
          const aWins = aValue > bValue;
          const bWins = bValue > aValue;
          return (
            <div
              key={key}
              className="grid grid-cols-3 items-center border-b border-border px-3 py-2 text-sm last:border-0"
            >
              <span
                className={`text-right font-display font-semibold ${aWins ? "text-accent" : "text-foreground"}`}
              >
                {Math.round(aValue)}
              </span>
              <span className="text-center text-xs uppercase tracking-wide text-muted">
                {label}
              </span>
              <span
                className={`text-left font-display font-semibold ${bWins ? "text-accent" : "text-foreground"}`}
              >
                {Math.round(bValue)}
              </span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
