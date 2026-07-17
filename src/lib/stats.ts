type Player = { id: string; name: string; team_id: string | null };
type Team = { id: string; name: string; crest_url?: string | null };
type GoalEvent = { player_id: string };
type CardEvent = { player_id: string; card_type: string };

export type ScorerRow = {
  playerId: string;
  playerName: string;
  teamName: string;
  teamCrestUrl: string | null;
  goals: number;
};

export type DisciplineRow = {
  playerId: string;
  playerName: string;
  teamName: string;
  teamCrestUrl: string | null;
  yellow: number;
  red: number;
};

function teamFor(player: Player, teams: Team[]): Team | undefined {
  return teams.find((t) => t.id === player.team_id);
}

function teamNameFor(player: Player, teams: Team[]): string {
  return teamFor(player, teams)?.name ?? "Sem time";
}

function teamCrestFor(player: Player, teams: Team[]): string | null {
  return teamFor(player, teams)?.crest_url ?? null;
}

export function computeTopScorers(
  players: Player[],
  goals: GoalEvent[],
  teams: Team[]
): ScorerRow[] {
  const counts = new Map<string, number>();
  for (const goal of goals) {
    counts.set(goal.player_id, (counts.get(goal.player_id) ?? 0) + 1);
  }

  return players
    .filter((p) => counts.has(p.id))
    .map((p) => ({
      playerId: p.id,
      playerName: p.name,
      teamName: teamNameFor(p, teams),
      teamCrestUrl: teamCrestFor(p, teams),
      goals: counts.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName, "pt-BR"));
}

export function computeDiscipline(
  players: Player[],
  cards: CardEvent[],
  teams: Team[]
): DisciplineRow[] {
  const counts = new Map<string, { yellow: number; red: number }>();
  for (const card of cards) {
    const entry = counts.get(card.player_id) ?? { yellow: 0, red: 0 };
    if (card.card_type === "yellow") entry.yellow += 1;
    else if (card.card_type === "red") entry.red += 1;
    counts.set(card.player_id, entry);
  }

  return players
    .filter((p) => counts.has(p.id))
    .map((p) => {
      const entry = counts.get(p.id)!;
      return {
        playerId: p.id,
        playerName: p.name,
        teamName: teamNameFor(p, teams),
        teamCrestUrl: teamCrestFor(p, teams),
        yellow: entry.yellow,
        red: entry.red,
      };
    })
    .sort(
      (a, b) =>
        b.red - a.red ||
        b.yellow - a.yellow ||
        a.playerName.localeCompare(b.playerName, "pt-BR")
    );
}
