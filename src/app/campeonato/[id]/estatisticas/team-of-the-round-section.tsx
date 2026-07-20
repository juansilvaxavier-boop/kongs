"use client";

import { useState } from "react";
import { Badge, EmptyState, Select } from "@/components/ui";
import { PlayerCard } from "@/components/player-card";
import { computeTeamOfTheRound, type RoundOvrEntry } from "@/lib/team-of-the-round";
import type { PlayerAttributes as Attributes } from "@/lib/gamification";

export type RoundPlayerInfo = {
  name: string;
  photoUrl: string | null;
  crestUrl: string | null;
  attributes: Attributes;
};

export function TeamOfTheRoundSection({
  rounds,
  entriesByRound,
  playersById,
}: {
  rounds: string[];
  entriesByRound: Record<string, RoundOvrEntry[]>;
  playersById: Record<string, RoundPlayerInfo>;
}) {
  const [round, setRound] = useState(rounds[0] ?? "");

  if (rounds.length === 0) {
    return <EmptyState>Ainda não há rodadas com jogos concluídos.</EmptyState>;
  }

  const slots = computeTeamOfTheRound(entriesByRound[round] ?? []);

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <Select value={round} onChange={(event) => setRound(event.target.value)}>
          {rounds.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </div>

      {slots.length === 0 ? (
        <EmptyState>Nenhum destaque para esta rodada ainda.</EmptyState>
      ) : (
        <div className="flex flex-wrap justify-center gap-4">
          {slots.map((slot) => {
            const player = playersById[slot.playerId];
            if (!player) return null;
            return (
              <div key={slot.playerId} className="flex flex-col items-center gap-2">
                <PlayerCard
                  name={player.name}
                  position={slot.position}
                  photoUrl={player.photoUrl}
                  crestUrl={player.crestUrl}
                  attributes={player.attributes}
                  size="sm"
                />
                <Badge tone="success">
                  +{slot.delta.toFixed(2)} OVR
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
