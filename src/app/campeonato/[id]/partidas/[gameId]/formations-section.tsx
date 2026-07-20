import { EmptyState } from "@/components/ui";
import { MiniPitch, type PitchPlayer } from "./mini-pitch";
import type { Formation } from "@/lib/lineup";

export type TeamLineup = {
  teamName: string;
  crestUrl: string | null;
  formation: Formation;
  starters: {
    Goleiro: PitchPlayer[];
    Zagueiro: PitchPlayer[];
    Meia: PitchPlayer[];
    Atacante: PitchPlayer[];
  };
  bench: PitchPlayer[];
};

function BenchList({ players }: { players: PitchPlayer[] }) {
  if (players.length === 0) return null;
  return (
    <div className="mt-3">
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Reservas</h4>
      <ul className="space-y-1">
        {players.map((player) => (
          <li
            key={player.id}
            className="flex items-center justify-between rounded-lg bg-surface-2/60 px-3 py-1.5 text-sm"
          >
            <span className="text-foreground">{player.name}</span>
            <span className="text-xs text-muted">
              {player.position ?? "—"} · {Math.round(player.attributes.ovr)} OVR
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FormationsSection({
  teamA,
  teamB,
}: {
  teamA: TeamLineup;
  teamB: TeamLineup;
}) {
  const hasAnyStarter = (team: TeamLineup) =>
    team.starters.Goleiro.length +
      team.starters.Zagueiro.length +
      team.starters.Meia.length +
      team.starters.Atacante.length >
    0;

  if (!hasAnyStarter(teamA) && !hasAnyStarter(teamB)) {
    return <EmptyState>Nenhum jogador cadastrado nos dois times ainda.</EmptyState>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <MiniPitch
          teamName={teamA.teamName}
          crestUrl={teamA.crestUrl}
          formation={teamA.formation}
          starters={teamA.starters}
        />
        <BenchList players={teamA.bench} />
      </div>
      <div>
        <MiniPitch
          teamName={teamB.teamName}
          crestUrl={teamB.crestUrl}
          formation={teamB.formation}
          starters={teamB.starters}
        />
        <BenchList players={teamB.bench} />
      </div>
    </div>
  );
}
