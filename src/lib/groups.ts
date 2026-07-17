type Team = { id: string; name: string; group_name: string | null };

export type TeamGroup<T extends Team> = {
  groupName: string | null;
  teams: T[];
};

/**
 * Agrupa times pelo campo group_name. Se nenhum time tiver grupo definido,
 * retorna um único grupo sem nome (comportamento padrão, tabela única).
 * Times sem grupo, quando outros times têm, caem num grupo "Sem grupo" à parte.
 */
export function groupTeams<T extends Team>(teams: T[]): TeamGroup<T>[] {
  const hasAnyGroup = teams.some((t) => t.group_name?.trim());
  if (!hasAnyGroup) {
    return [{ groupName: null, teams }];
  }

  const byGroup = new Map<string, T[]>();
  const withoutGroup: T[] = [];

  for (const team of teams) {
    const key = team.group_name?.trim();
    if (!key) {
      withoutGroup.push(team);
      continue;
    }
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(team);
  }

  const groups: TeamGroup<T>[] = [...byGroup.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))
    .map(([groupName, groupTeams]) => ({ groupName, teams: groupTeams }));

  if (withoutGroup.length > 0) {
    groups.push({ groupName: "Sem grupo", teams: withoutGroup });
  }

  return groups;
}

/**
 * Aplica o agrupamento de acordo com o formato do campeonato: em "copa",
 * agrupa por group_name (fase de grupos); em "liga", sempre uma tabela
 * única, ignorando qualquer group_name que os times tenham.
 */
export function groupTeamsByFormat<T extends Team>(
  format: string,
  teams: T[]
): TeamGroup<T>[] {
  if (format === "copa") return groupTeams(teams);
  return [{ groupName: null, teams }];
}

/**
 * Gera os rótulos de grupo (Grupo A, Grupo B, ...) a partir da quantidade
 * de grupos configurada no campeonato. Acima de 26 grupos, cai para
 * numeração (Grupo 27, Grupo 28, ...) já que o alfabeto acabou.
 */
export function generateGroupLabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    i < 26 ? `Grupo ${String.fromCharCode(65 + i)}` : `Grupo ${i + 1}`
  );
}

/**
 * Embaralha uma lista (Fisher-Yates). Aceita um gerador de números
 * aleatórios customizado (para testes determinísticos); usa Math.random
 * por padrão.
 */
export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Distribui os ids de times (já na ordem desejada, tipicamente já
 * embaralhada por `shuffle`) em `groupCount` grupos, alternando um a um
 * (round-robin) para manter os grupos com tamanhos o mais parecidos
 * possível. Retorna um mapa de teamId -> rótulo do grupo.
 */
export function assignTeamsToGroups(
  teamIds: string[],
  groupCount: number
): Map<string, string> {
  const labels = generateGroupLabels(groupCount);
  const assignment = new Map<string, string>();
  teamIds.forEach((teamId, index) => {
    assignment.set(teamId, labels[index % groupCount]);
  });
  return assignment;
}

/**
 * Filtra jogos para os que envolvem apenas times de um mesmo grupo
 * (usado para calcular a classificação de cada grupo isoladamente).
 */
export function gamesWithinTeams<
  G extends { team_a_id: string; team_b_id: string },
>(games: G[], teams: { id: string }[]): G[] {
  const ids = new Set(teams.map((t) => t.id));
  return games.filter((g) => ids.has(g.team_a_id) && ids.has(g.team_b_id));
}
