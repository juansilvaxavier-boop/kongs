"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { PlayerCard } from "@/components/player-card";
import { FavoriteButton } from "@/components/favorite-button";
import { PLAYER_POSITIONS } from "@/lib/positions";
import type { Achievement } from "@/lib/achievements";
import type { PlayerAttributes as Attributes } from "@/lib/gamification";
import { PlayerCardModal, type HistoryEntry } from "./player-card-modal";

export type RosterPlayer = {
  id: string;
  name: string;
  number: number | null;
  position: string | null;
  photoUrl: string | null;
  suspended: boolean;
  pendingSuspension: boolean;
  isBirthday: boolean;
  attributes: Attributes;
  history: HistoryEntry[];
  mvpCount: number;
  achievements: Achievement[];
};

export function PlayerRosterGrid({
  players,
  crestUrl,
  favoritedPlayerIds,
}: {
  players: RosterPlayer[];
  crestUrl?: string | null;
  favoritedPlayerIds?: string[] | null;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const favoritedSet = new Set(favoritedPlayerIds ?? []);
  const openPlayer = players.find((p) => p.id === openId) ?? null;

  const groups = [...PLAYER_POSITIONS, "Sem posição"].map((position) => ({
    position,
    players:
      position === "Sem posição"
        ? players.filter((p) => !p.position || !(PLAYER_POSITIONS as readonly string[]).includes(p.position))
        : players.filter((p) => p.position === position),
  }));

  return (
    <>
      <div className="space-y-6">
        {groups.map((group) =>
          group.players.length === 0 ? null : (
            <div key={group.position}>
              <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-wide text-muted">
                {group.position}
              </h3>
              <div className="flex flex-wrap gap-4">
                {group.players.map((player) => (
                  <div key={player.id} className="relative">
                    {(player.suspended || player.pendingSuspension || player.isBirthday) && (
                      <div className="absolute -top-2 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1">
                        {player.isBirthday && (
                          <Badge tone="success">🎂 Aniversário</Badge>
                        )}
                        {player.suspended && <Badge tone="warning">Suspenso</Badge>}
                        {!player.suspended && player.pendingSuspension && (
                          <Badge tone="default">Pendurado</Badge>
                        )}
                      </div>
                    )}
                    {favoritedPlayerIds !== null && favoritedPlayerIds !== undefined && (
                      <div className="absolute -right-2 -top-2 z-10">
                        <FavoriteButton
                          kind="player"
                          entityId={player.id}
                          initialFavorited={favoritedSet.has(player.id)}
                          size="sm"
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setOpenId(player.id)}
                      className="text-left transition hover:-translate-y-1"
                    >
                      <PlayerCard
                        name={player.name}
                        position={player.position}
                        number={player.number}
                        photoUrl={player.photoUrl}
                        crestUrl={crestUrl}
                        attributes={player.attributes}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
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
          achievements={openPlayer.achievements}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}
