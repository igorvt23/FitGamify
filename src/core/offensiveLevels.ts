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
    2: "../img/fat/level_02.png",
    3: "../img/fat/level_03.png",
    4: "../img/fat/level_04.png",

    5: "../img/fat/level_04.png",
    6: "../img/fat/level_04.png",
    7: "../img/fat/level_04.png",
    8: "../img/fat/level_04.png",
    9: "../img/fat/level_04.png",
    10: "../img/fat/level_04.png",
    11: "../img/fat/level_04.png",
    12: "../img/fat/level_04.png",
    13: "../img/fat/level_04.png",
    14: "../img/fat/level_04.png",
    15: "../img/fat/level_04.png",
    16: "../img/fat/level_04.png",
    17: "../img/fat/level_04.png",
    18: "../img/fat/level_04.png",
    19: "../img/fat/level_04.png",
    20: "../img/fat/level_04.png",
    21: "../img/fat/level_04.png",
    22: "../img/fat/level_04.png",
    23: "../img/fat/level_04.png",
    24: "../img/fat/level_04.png",
    25: "../img/fat/level_04.png",
    26: "../img/fat/level_04.png",
    27: "../img/fat/level_04.png",
    28: "../img/fat/level_04.png",
    29: "../img/fat/level_04.png",
    30: "../img/fat/level_04.png",
    31: "../img/fat/level_04.png",
    32: "../img/fat/level_04.png",
    33: "../img/fat/level_04.png",
    34: "../img/fat/level_04.png",
    35: "../img/fat/level_04.png",
    36: "../img/fat/level_04.png",
    37: "../img/fat/level_04.png",
    38: "../img/fat/level_04.png",
    39: "../img/fat/level_04.png",
    40: "../img/fat/level_04.png",
    41: "../img/fat/level_04.png",
    42: "../img/fat/level_04.png",
    43: "../img/fat/level_04.png",
    44: "../img/fat/level_04.png",
  },
  gain: {
    1: "../img/skinny/level_01.png",
    2: "../img/skinny/level_02.png",
    3: "../img/skinny/level_03.png",
    4: "../img/skinny/level_04.png",
    5: "../img/skinny/level_05.png",
    6: "../img/skinny/level_06.png",
    7: "../img/skinny/level_07.png",
    8: "../img/skinny/level_08.png",

    9: "../img/skinny/level_09.png",
    10: "../img/skinny/level_10.png",
    11: "../img/skinny/level_11.png",
    12: "../img/skinny/level_11.png",
    13: "../img/skinny/level_11.png",
    14: "../img/skinny/level_11.png",
    15: "../img/skinny/level_11.png",
    16: "../img/skinny/level_11.png",
    17: "../img/skinny/level_11.png",
    18: "../img/skinny/level_11.png",
    19: "../img/skinny/level_11.png",
    20: "../img/skinny/level_11.png",
    21: "../img/skinny/level_11.png",
    22: "../img/skinny/level_11.png",
    23: "../img/skinny/level_11.png",
    24: "../img/skinny/level_11.png",
    25: "../img/skinny/level_11.png",
    26: "../img/skinny/level_11.png",
    27: "../img/skinny/level_11.png",
    28: "../img/skinny/level_11.png",
    29: "../img/skinny/level_11.png",
    30: "../img/skinny/level_11.png",
    31: "../img/skinny/level_11.png",
    32: "../img/skinny/level_11.png",
    33: "../img/skinny/level_11.png",
    34: "../img/skinny/level_11.png",
    35: "../img/skinny/level_11.png",
    36: "../img/skinny/level_11.png",
    37: "../img/skinny/level_11.png",
    38: "../img/skinny/level_11.png",
    39: "../img/skinny/level_11.png",
    40: "../img/skinny/level_11.png",
    41: "../img/skinny/level_11.png",
    42: "../img/skinny/level_11.png",
    43: "../img/skinny/level_11.png",
    44: "../img/skinny/level_11.png",
  },
  maintain: {
    1: "../img/in_shape/level_01.png",
    2: "../img/in_shape/level_02.png",
    3: "../img/in_shape/level_03.png",
    4: "../img/in_shape/level_04.png",
     
    5: "../img/in_shape/level_04.png",
    6: "../img/in_shape/level_04.png",
    7: "../img/in_shape/level_04.png",
    8: "../img/in_shape/level_04.png",
    9: "../img/in_shape/level_04.png",
    10: "../img/in_shape/level_04.png",
    11: "../img/in_shape/level_04.png",
    12: "../img/in_shape/level_04.png",
    13: "../img/in_shape/level_04.png",
    14: "../img/in_shape/level_04.png",
    15: "../img/in_shape/level_04.png",
    16: "../img/in_shape/level_04.png",
    17: "../img/in_shape/level_04.png",
    18: "../img/in_shape/level_04.png",
    19: "../img/in_shape/level_04.png",
    20: "../img/in_shape/level_04.png",
    21: "../img/in_shape/level_04.png",
    22: "../img/in_shape/level_04.png",
    23: "../img/in_shape/level_04.png",
    24: "../img/in_shape/level_04.png",
    25: "../img/in_shape/level_04.png",
    26: "../img/in_shape/level_04.png",
    27: "../img/in_shape/level_04.png",
    28: "../img/in_shape/level_04.png",
    29: "../img/in_shape/level_04.png",
    30: "../img/in_shape/level_04.png",
    31: "../img/in_shape/level_04.png",
    32: "../img/in_shape/level_04.png",
    33: "../img/in_shape/level_04.png",
    34: "../img/in_shape/level_04.png",
    35: "../img/in_shape/level_04.png",
    36: "../img/in_shape/level_04.png",
    37: "../img/in_shape/level_04.png",
    38: "../img/in_shape/level_04.png",
    39: "../img/in_shape/level_04.png",
    40: "../img/in_shape/level_04.png",
    41: "../img/in_shape/level_04.png",
    42: "../img/in_shape/level_04.png",
    43: "../img/in_shape/level_04.png",
    44: "../img/in_shape/level_04.png",
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
    requiredOffensiveDays: level * 7,
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
  const levelNumber = Math.max(1, Math.min(OFFENSIVE_LEVELS.length, Math.floor(normalizedDays / 7) + 1));
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
  return Math.max(0, current.requiredOffensiveDays + 7 - Math.max(0, Math.floor(offensiveDays)));
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
