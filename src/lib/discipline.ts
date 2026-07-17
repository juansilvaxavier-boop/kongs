import { naturalCompare } from "./datetime";

type Game = {
  id: string;
  team_a_id: string;
  team_b_id: string;
  date: string | null;
  round: string;
  played: boolean;
};
type CardEvent = { player_id: string; card_type: string; game_id: string };
type Player = { id: string; team_id: string | null };

export type SuspensionStatus = {
  suspended: boolean;
  reason: "yellow" | "red" | null;
};

function sortGamesChronologically(games: Game[]): Game[] {
  return [...games].sort((a, b) => {
    if (a.date && b.date) return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    if (a.date) return -1;
    if (b.date) return 1;
    return naturalCompare(a.round, b.round);
  });
}

/**
 * Para cada jogador, indica se está suspenso para o próximo jogo do time:
 * cartão vermelho no último jogo disputado sempre suspende; cartões
 * amarelos suspendem quando o total acumulado cruza um múltiplo do
 * limiar (yellowThreshold) exatamente no último jogo disputado. Como não
 * há controle de escalação, a suspensão é apenas informativa e "expira"
 * sozinha assim que o time disputa o jogo seguinte.
 */
export function computeSuspensions(
  players: Player[],
  cardEvents: CardEvent[],
  games: Game[],
  yellowThreshold: number
): Map<string, SuspensionStatus> {
  const result = new Map<string, SuspensionStatus>();

  const gamesByTeam = new Map<string, Game[]>();
  for (const game of games) {
    if (!game.played) continue;
    for (const teamId of [game.team_a_id, game.team_b_id]) {
      if (!gamesByTeam.has(teamId)) gamesByTeam.set(teamId, []);
      gamesByTeam.get(teamId)!.push(game);
    }
  }
  for (const [teamId, teamGames] of gamesByTeam) {
    gamesByTeam.set(teamId, sortGamesChronologically(teamGames));
  }

  for (const player of players) {
    result.set(player.id, { suspended: false, reason: null });
    if (!player.team_id) continue;

    const teamGames = gamesByTeam.get(player.team_id);
    if (!teamGames || teamGames.length === 0) continue;

    const lastGame = teamGames[teamGames.length - 1];
    const priorGameIds = new Set(teamGames.slice(0, -1).map((g) => g.id));

    const playerCards = cardEvents.filter((c) => c.player_id === player.id);
    const yellowsBefore = playerCards.filter(
      (c) => c.card_type === "yellow" && priorGameIds.has(c.game_id)
    ).length;
    const yellowsInLastGame = playerCards.filter(
      (c) => c.card_type === "yellow" && c.game_id === lastGame.id
    ).length;
    const hasRedInLastGame = playerCards.some(
      (c) => c.card_type === "red" && c.game_id === lastGame.id
    );

    if (hasRedInLastGame) {
      result.set(player.id, { suspended: true, reason: "red" });
      continue;
    }

    const crossedThreshold =
      Math.floor((yellowsBefore + yellowsInLastGame) / yellowThreshold) >
      Math.floor(yellowsBefore / yellowThreshold);

    if (crossedThreshold) {
      result.set(player.id, { suspended: true, reason: "yellow" });
    }
  }

  return result;
}
