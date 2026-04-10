import { Achievement, AchievementCode, WorkoutWithExercises } from "../types";

type AchievementTemplate = {
  code: AchievementCode;
  title: string;
  detail: string;
  unlocks: (totalCompleted: number, streak: number) => boolean;
};

export function resolveNewAchievements(params: {
  completedSessions: WorkoutWithExercises[];
  currentStreak: number;
  unlockedCodes: Set<AchievementCode>;
  t: (key: string) => string;
}): Achievement[] {
  const { completedSessions, currentStreak, unlockedCodes, t } = params;
  const totalCompleted = completedSessions.filter((item) => Boolean(item.checkedInAtIso)).length;

  const templates: AchievementTemplate[] = [
    {
      code: "first_checkin",
      title: t("achievement.first.title"),
      detail: t("achievement.first.detail"),
      unlocks: (total) => total >= 1
    },
    {
      code: "streak_3",
      title: t("achievement.streak3.title"),
      detail: t("achievement.streak3.detail"),
      unlocks: (_, streak) => streak >= 3
    },
    {
      code: "streak_7",
      title: t("achievement.streak7.title"),
      detail: t("achievement.streak7.detail"),
      unlocks: (_, streak) => streak >= 7
    },
    {
      code: "streak_14",
      title: t("achievement.streak14.title"),
      detail: t("achievement.streak14.detail"),
      unlocks: (_, streak) => streak >= 14
    },
    {
      code: "streak_30",
      title: t("achievement.streak30.title"),
      detail: t("achievement.streak30.detail"),
      unlocks: (_, streak) => streak >= 30
    },
    {
      code: "workout_10",
      title: t("achievement.workout10.title"),
      detail: t("achievement.workout10.detail"),
      unlocks: (total) => total >= 10
    },
    {
      code: "workout_25",
      title: t("achievement.workout25.title"),
      detail: t("achievement.workout25.detail"),
      unlocks: (total) => total >= 25
    },
    {
      code: "workout_50",
      title: t("achievement.workout50.title"),
      detail: t("achievement.workout50.detail"),
      unlocks: (total) => total >= 50
    }
  ];

  return templates
    .filter((entry) => !unlockedCodes.has(entry.code) && entry.unlocks(totalCompleted, currentStreak))
    .map((entry) => ({
      id: `${entry.code}-${Date.now()}`,
      code: entry.code,
      title: entry.title,
      detail: entry.detail,
      unlockedAtIso: new Date().toISOString()
    }));
}
