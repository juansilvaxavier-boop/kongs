"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { PlayerCard } from "@/components/player-card";
import { PlayerCardModal, type HistoryEntry } from "./player-card-modal";

type Attributes = {
  ovr: number;
  ritmo: number;
  finalizacao: number;
  passe: number;
  drible: number;
  defesa: number;
  fisico: number;
};

export type RosterPlayer = {
  id: string;
  name: string;
  number: number | null;
  position: string | null;
  photoUrl: string | null;
  suspended: boolean;
  attributes: Attributes;
  history: HistoryEntry[];
  mvpCount: number;
};

export function PlayerRosterGrid({
  players,
  crestUrl,
}: {
  players: RosterPlayer[];
  crestUrl?: string | null;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openPlayer = players.find((p) => p.id === openId) ?? null;

  return (
    <>
      <div className="flex flex-wrap gap-4">
        {players.map((player) => (
          <button
            key={player.id}
            type="button"
            onClick={() => setOpenId(player.id)}
            className="relative text-left transition hover:-translate-y-1"
          >
            {player.suspended && (
              <Badge tone="warning" className="absolute -top-2 left-1/2 z-10 -translate-x-1/2">
                Suspenso
              </Badge>
            )}
            <PlayerCard
              name={player.name}
              position={player.position}
              number={player.number}
              photoUrl={player.photoUrl}
              crestUrl={crestUrl}
              attributes={player.attributes}
            />
          </button>
        ))}
      </div>

      {openPlayer && (
        <PlayerCardModal
          name={openPlayer.name}
          position={openPlayer.position}
          number={openPlayer.number}
          photoUrl={openPlayer.photoUrl}
          crestUrl={crestUrl}
          attributes={openPlayer.attributes}
          history={openPlayer.history}
          mvpCount={openPlayer.mvpCount}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}
