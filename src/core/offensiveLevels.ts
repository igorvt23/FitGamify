import { AppLanguage, FitnessGoal } from "../types";
import { normalizeFitnessGoal } from "./fitnessGoal";

type LocalizedText = Record<AppLanguage, string>;

export type OffensiveLevel = {
  level: number;
  phase: 1 | 2 | 3 | 4 | 5;
  requiredOffensiveDays: number;
  imageHrefByGoal: Record<FitnessGoal, string>;
  title: LocalizedText;
};

export const OFFENSIVE_LEVEL_IMAGE_HREFS_BY_GOAL: Record<FitnessGoal, Record<number, string>> = {
  lose: {
    1: "../img/fat/level_01.png",
    2: "../img/fat/level_02.png"
  },
  gain: {
    1: "../img/skinny/level_01.png",
    2: "../img/skinny/level_02.png"
  },
  maintain: {
    1: "../img/in_shape/level_01.png",
    2: "../img/in_shape/level_02.png"
  }
};

const LEVEL_TITLES_PT = [
  "Inerte",
  "Despertando",
  "Iniciante",
  "Aprendiz",
  "Curioso",
  "Motivado",
  "Persistente",
  "Dedicado",
  "Focado",
  "Em evolucao",
  "Resistente",
  "Disciplinado",
  "Consistente",
  "Determinado",
  "Incansavel",
  "Ativo",
  "Forte",
  "Avancado",
  "Guerreiro",
  "Imparavel",
  "Dominante",
  "Hardcore",
  "Monstro",
  "Atleta",
  "Competidor",
  "Elite",
  "Brutal",
  "Insano",
  "Lendario",
  "Tita",
  "Ascendido",
  "Supremo",
  "Invencivel",
  "Mitico",
  "Deus da Forca",
  "Lenda Viva",
  "Forma Maxima"
] as const;

const LEVEL_TITLES_EN = [
  "Inert",
  "Awakening",
  "Beginner",
  "Apprentice",
  "Curious",
  "Motivated",
  "Persistent",
  "Dedicated",
  "Focused",
  "Evolving",
  "Resilient",
  "Disciplined",
  "Consistent",
  "Determined",
  "Tireless",
  "Active",
  "Strong",
  "Advanced",
  "Warrior",
  "Unstoppable",
  "Dominant",
  "Hardcore",
  "Beast",
  "Athlete",
  "Competitor",
  "Elite",
  "Brutal",
  "Insane",
  "Legendary",
  "Titan",
  "Ascended",
  "Supreme",
  "Invincible",
  "Mythic",
  "God of Strength",
  "Living Legend",
  "Max Form"
] as const;

const LEVEL_TITLES_ES = [
  "Inerte",
  "Despertando",
  "Principiante",
  "Aprendiz",
  "Curioso",
  "Motivado",
  "Persistente",
  "Dedicado",
  "Enfocado",
  "En evolucion",
  "Resistente",
  "Disciplinado",
  "Constante",
  "Determinado",
  "Incansable",
  "Activo",
  "Fuerte",
  "Avanzado",
  "Guerrero",
  "Imparable",
  "Dominante",
  "Hardcore",
  "Monstruo",
  "Atleta",
  "Competidor",
  "Elite",
  "Brutal",
  "Insano",
  "Legendario",
  "Titan",
  "Ascendido",
  "Supremo",
  "Invencible",
  "Mitico",
  "Dios de la Fuerza",
  "Leyenda Viva",
  "Forma Maxima"
] as const;

export const OFFENSIVE_LEVELS: OffensiveLevel[] = LEVEL_TITLES_PT.map((ptTitle, index) => {
  const level = index + 1;
  return {
    level,
    phase: getPhaseByLevel(level),
    requiredOffensiveDays: level * 10,
    imageHrefByGoal: {
      lose: getOffensiveLevelImageHrefByGoal(level, "lose"),
      gain: getOffensiveLevelImageHrefByGoal(level, "gain"),
      maintain: getOffensiveLevelImageHrefByGoal(level, "maintain")
    },
    title: {
      "pt-BR": ptTitle,
      en: LEVEL_TITLES_EN[index],
      es: LEVEL_TITLES_ES[index]
    }
  };
});

export function getOffensiveLevelByDays(offensiveDays: number) {
  const normalizedDays = Math.max(0, Math.floor(offensiveDays));
  const levelNumber = Math.max(1, Math.min(OFFENSIVE_LEVELS.length, Math.floor(normalizedDays / 10) + 1));
  return OFFENSIVE_LEVELS[levelNumber - 1];
}

export function getOffensiveLevelTitle(level: OffensiveLevel, language: AppLanguage) {
  return level.title[language] ?? level.title["pt-BR"];
}

export function getOffensiveLevelImageHrefByGoal(level: number, goal: FitnessGoal | string | null | undefined) {
  const normalizedGoal = normalizeFitnessGoal(goal);
  const images = OFFENSIVE_LEVEL_IMAGE_HREFS_BY_GOAL[normalizedGoal];

  const exact = images[level];
  if (exact) {
    return exact;
  }

  const availableLevels = Object.keys(images)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0)
    .sort((a, b) => a - b);
  if (availableLevels.length === 0) {
    return "";
  }

  const lessOrEqual = availableLevels.filter((item) => item <= level);
  const fallbackLevel = lessOrEqual[lessOrEqual.length - 1] ?? availableLevels[0];
  return images[fallbackLevel] ?? "";
}

export function getOffensiveDaysToNextLevel(offensiveDays: number) {
  const current = getOffensiveLevelByDays(offensiveDays);
  if (current.level >= OFFENSIVE_LEVELS.length) {
    return 0;
  }
  return Math.max(0, current.requiredOffensiveDays + 10 - Math.max(0, Math.floor(offensiveDays)));
}

function getPhaseByLevel(level: number): OffensiveLevel["phase"] {
  if (level <= 7) {
    return 1;
  }
  if (level <= 15) {
    return 2;
  }
  if (level <= 23) {
    return 3;
  }
  if (level <= 30) {
    return 4;
  }
  return 5;
}
