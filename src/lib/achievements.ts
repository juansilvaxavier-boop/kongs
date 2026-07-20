import type { Position, Rarity } from "./gamification";

export type Achievement = {
  id: string;
  label: string;
  icon: string;
  description: string;
};

export function computeAchievements(input: {
  goalsTotal: number;
  maxGoalsSingleGame: number;
  isTopScorer: boolean;
  cardsTotal: number;
  wasMvp: boolean;
  position: Position | string | null;
  ovr: number;
  rarity: Rarity;
}): Achievement[] {
  const achievements: Achievement[] = [];

  if (input.isTopScorer) {
    achievements.push({
      id: "artilheiro",
      label: "Artilheiro",
      icon: "👑",
      description: "Maior artilheiro do campeonato",
    });
  }

  if (input.maxGoalsSingleGame >= 3) {
    achievements.push({
      id: "hat-trick",
      label: "Hat-trick",
      icon: "🎩",
      description: "Marcou 3 gols ou mais em uma única partida",
    });
  }

  if (input.wasMvp) {
    achievements.push({
      id: "craque-do-jogo",
      label: "Craque do jogo",
      icon: "⭐",
      description: "Eleito o melhor em campo em pelo menos uma partida",
    });
  }

  if (input.goalsTotal > 0 && input.cardsTotal === 0) {
    achievements.push({
      id: "fair-play",
      label: "Fair Play",
      icon: "🤝",
      description: "Nenhum cartão recebido no campeonato",
    });
  }

  if (input.rarity === "legend") {
    achievements.push({
      id: "lenda",
      label: "Lenda",
      icon: "🐐",
      description: "Alcançou o overall máximo (Legend)",
    });
  }

  if ((input.position === "Zagueiro" || input.position === "Goleiro") && input.ovr >= 80) {
    achievements.push({
      id: "muralha",
      label: "Muralha",
      icon: "🧱",
      description: "Overall 80+ na defesa",
    });
  }

  if ((input.position === "Meia" || input.position === "Atacante") && input.ovr >= 80) {
    achievements.push({
      id: "camisa-10",
      label: "Camisa 10",
      icon: "🎯",
      description: "Overall 80+ no ataque",
    });
  }

  return achievements;
}
