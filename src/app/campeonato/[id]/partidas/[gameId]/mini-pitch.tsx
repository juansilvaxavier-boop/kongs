import Image from "next/image";
import { PlayerCard } from "@/components/player-card";
import type { Formation } from "@/lib/lineup";
import type { PlayerAttributes as Attributes } from "@/lib/gamification";

export type PitchPlayer = {
  id: string;
  name: string;
  position: string | null;
  number: number | null;
  photoUrl: string | null;
  attributes: Attributes;
};

export function MiniPitch({
  teamName,
  crestUrl,
  formation,
  starters,
}: {
  teamName: string;
  crestUrl: string | null;
  formation: Formation;
  starters: {
    Goleiro: PitchPlayer[];
    Zagueiro: PitchPlayer[];
    Meia: PitchPlayer[];
    Atacante: PitchPlayer[];
  };
}) {
  const rows: { label: string; players: PitchPlayer[] }[] = [
    { label: "Atacante", players: starters.Atacante },
    { label: "Meia", players: starters.Meia },
    { label: "Zagueiro", players: starters.Zagueiro },
    { label: "Goleiro", players: starters.Goleiro },
  ];

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-b from-emerald-900/50 to-emerald-950/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {crestUrl ? (
            <span className="relative h-6 w-6 shrink-0">
              <Image src={crestUrl} alt="" fill loading="eager" sizes="24px" className="rounded-full object-cover" />
            </span>
          ) : null}
          <span className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
            {teamName}
          </span>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          {formation}
        </span>
      </div>
      <div className="space-y-5">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap justify-center gap-3">
            {row.players.length === 0 ? (
              <span className="text-xs text-muted">—</span>
            ) : (
              row.players.map((player) => (
                <PlayerCard
                  key={player.id}
                  name={player.name}
                  position={player.position}
                  number={player.number}
                  photoUrl={player.photoUrl}
                  crestUrl={crestUrl}
                  attributes={player.attributes}
                  size="sm"
                />
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
