import { resolveNewAchievements } from "../src/core/gamification";
import { WorkoutWithExercises } from "../src/types";

const t = (key: string) => key;

function buildCompletedSessions(count: number): WorkoutWithExercises[] {
  return Array.from({ length: count }).map((_, index) => ({
    id: `s-${index}`,
    dateIso: `2026-03-${String(index + 1).padStart(2, "0")}`,
    sessionIndex: 0,
    checkedInAtIso: "2026-03-01T10:00:00.000Z",
    templateId: null,
    templateName: null,
    muscleGroup: null,
    notes: "",
    exercises: []
  }));
}

describe("resolveNewAchievements", () => {
  it("unlocks first check-in", () => {
    const result = resolveNewAchievements({
      completedSessions: buildCompletedSessions(1),
      currentStreak: 1,
      unlockedCodes: new Set(),
      t
    });
    expect(result.some((entry) => entry.code === "first_checkin")).toBe(true);
  });

  it("does not return already unlocked achievements", () => {
    const result = resolveNewAchievements({
      completedSessions: buildCompletedSessions(10),
      currentStreak: 7,
      unlockedCodes: new Set(["workout_10"]),
      t
    });
    expect(result.some((entry) => entry.code === "workout_10")).toBe(false);
  });

  it("unlocks expanded milestones", () => {
    const result = resolveNewAchievements({
      completedSessions: buildCompletedSessions(50),
      currentStreak: 30,
      unlockedCodes: new Set(),
      t
    });
    expect(result.some((entry) => entry.code === "streak_14")).toBe(true);
    expect(result.some((entry) => entry.code === "streak_30")).toBe(true);
    expect(result.some((entry) => entry.code === "workout_25")).toBe(true);
    expect(result.some((entry) => entry.code === "workout_50")).toBe(true);
  });
});
