import * as SQLite from "expo-sqlite";

import {
  Achievement,
  CloudBackupPayload,
  Exercise,
  ExerciseLibraryItem,
  TemplateExercise,
  UserProfile,
  Weekday,
  WorkoutSession,
  WorkoutTemplate,
  WorkoutWithExercises
} from "../types";

const db = SQLite.openDatabaseSync("fitgamify.db");

export async function initDatabase() {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      date_iso TEXT NOT NULL UNIQUE,
      checked_in_at_iso TEXT,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      name TEXT NOT NULL,
      sets INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight_kg REAL NOT NULL DEFAULT 0,
      intensity REAL NOT NULL DEFAULT 5,
      image_key TEXT NOT NULL,
      FOREIGN KEY(session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      detail TEXT NOT NULL,
      unlocked_at_iso TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY NOT NULL,
      display_name TEXT NOT NULL,
      current_streak INTEGER NOT NULL DEFAULT 0,
      last_checkin_at_iso TEXT
    );
    CREATE TABLE IF NOT EXISTS error_logs (
      id TEXT PRIMARY KEY NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at_iso TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS exercise_library (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      image_key TEXT NOT NULL,
      created_at_iso TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS workout_templates (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      weekday INTEGER NOT NULL,
      created_at_iso TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS template_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      template_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      sets INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      image_key TEXT NOT NULL,
      FOREIGN KEY(template_id) REFERENCES workout_templates(id) ON DELETE CASCADE
    );
  `);

  const profile = await getProfileOrNull();
  if (!profile) {
    await db.runAsync(
      "INSERT INTO user_profile (id, display_name, current_streak, last_checkin_at_iso) VALUES (?, ?, ?, ?)",
      cryptoRandomId(),
      "Atleta",
      0,
      null
    );
  }
}

export async function getTodayWorkout(): Promise<WorkoutWithExercises | null> {
  return getWorkoutByDate(isoDateOnly(new Date()));
}

export async function createTodayWorkoutIfMissing() {
  const todayIso = isoDateOnly(new Date());
  const existing = await getWorkoutByDate(todayIso);
  if (existing) {
    return existing;
  }

  const sessionId = cryptoRandomId();
  await db.runAsync(
    "INSERT INTO workout_sessions (id, date_iso, checked_in_at_iso, notes) VALUES (?, ?, ?, ?)",
    sessionId,
    todayIso,
    null,
    ""
  );

  const weekday = new Date().getDay() as Weekday;
  const todayTemplate = await getTemplateByWeekday(weekday);
  const templateExercises = todayTemplate ? await getTemplateExercises(todayTemplate.id) : [];

  const fallbackExercises: Array<Omit<Exercise, "id">> = [
    { name: "Agachamento", sets: 4, reps: 10, weightKg: 0, intensity: 5, imageKey: "human-male-squat" },
    { name: "Supino", sets: 4, reps: 8, weightKg: 0, intensity: 5, imageKey: "human-male-board" },
    { name: "Remada", sets: 3, reps: 12, weightKg: 0, intensity: 5, imageKey: "rowing" }
  ];

  const sourceExercises =
    templateExercises.length > 0
      ? templateExercises.map((item) => ({
          name: item.exerciseName,
          sets: item.sets,
          reps: item.reps,
          weightKg: 0,
          intensity: 5,
          imageKey: item.imageKey
        }))
      : fallbackExercises;

  for (const entry of sourceExercises) {
    await db.runAsync(
      "INSERT INTO exercises (id, session_id, name, sets, reps, weight_kg, intensity, image_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      cryptoRandomId(),
      sessionId,
      entry.name,
      entry.sets,
      entry.reps,
      entry.weightKg,
      entry.intensity,
      entry.imageKey
    );
  }

  return getWorkoutByDate(todayIso);
}

export async function updateExerciseMetrics(exerciseId: string, weightKg: number, intensity: number) {
  await db.runAsync("UPDATE exercises SET weight_kg = ?, intensity = ? WHERE id = ?", weightKg, intensity, exerciseId);
}

export async function checkInTodayWorkout(sessionId: string) {
  await db.runAsync("UPDATE workout_sessions SET checked_in_at_iso = ? WHERE id = ?", new Date().toISOString(), sessionId);
}

export async function getAllSessions(): Promise<WorkoutWithExercises[]> {
  const sessions = await db.getAllAsync<WorkoutSession>(
    "SELECT id, date_iso as dateIso, checked_in_at_iso as checkedInAtIso, notes FROM workout_sessions ORDER BY date_iso ASC"
  );
  const result: WorkoutWithExercises[] = [];
  for (const session of sessions) {
    const exercises = await getExercisesBySessionId(session.id);
    result.push({ ...session, exercises });
  }
  return result;
}

export async function getAchievements(): Promise<Achievement[]> {
  return db.getAllAsync<Achievement>(
    "SELECT id, code, title, detail, unlocked_at_iso as unlockedAtIso FROM achievements ORDER BY unlocked_at_iso DESC"
  );
}

export async function insertAchievement(achievement: Achievement) {
  await db.runAsync(
    "INSERT OR IGNORE INTO achievements (id, code, title, detail, unlocked_at_iso) VALUES (?, ?, ?, ?, ?)",
    achievement.id,
    achievement.code,
    achievement.title,
    achievement.detail,
    achievement.unlockedAtIso
  );
}

export async function getProfile(): Promise<UserProfile> {
  const profile = await getProfileOrNull();
  if (!profile) {
    throw new Error("Perfil nao encontrado.");
  }
  return profile;
}

export async function updateProfileStreak(profileId: string, currentStreak: number, lastCheckInAtIso: string | null) {
  await db.runAsync(
    "UPDATE user_profile SET current_streak = ?, last_checkin_at_iso = ? WHERE id = ?",
    currentStreak,
    lastCheckInAtIso,
    profileId
  );
}

export async function updateProfileDisplayName(profileId: string, displayName: string) {
  await db.runAsync("UPDATE user_profile SET display_name = ? WHERE id = ?", displayName, profileId);
}

export async function logError(category: string, message: string) {
  await db.runAsync(
    "INSERT INTO error_logs (id, category, message, created_at_iso) VALUES (?, ?, ?, ?)",
    cryptoRandomId(),
    category,
    message,
    new Date().toISOString()
  );
}

export async function getRecentErrors(limit = 10) {
  return db.getAllAsync<{ id: string; category: string; message: string; createdAtIso: string }>(
    "SELECT id, category, message, created_at_iso as createdAtIso FROM error_logs ORDER BY created_at_iso DESC LIMIT ?",
    limit
  );
}

export async function getExerciseLibrary(): Promise<ExerciseLibraryItem[]> {
  return db.getAllAsync<ExerciseLibraryItem>(
    "SELECT id, name, image_key as imageKey, created_at_iso as createdAtIso FROM exercise_library ORDER BY name ASC"
  );
}

export async function createExerciseLibraryItem(name: string, imageKey: string) {
  await db.runAsync(
    "INSERT OR IGNORE INTO exercise_library (id, name, image_key, created_at_iso) VALUES (?, ?, ?, ?)",
    cryptoRandomId(),
    name.trim(),
    imageKey,
    new Date().toISOString()
  );
}

export async function getTemplates(): Promise<WorkoutTemplate[]> {
  return db.getAllAsync<WorkoutTemplate>(
    "SELECT id, name, muscle_group as muscleGroup, weekday, created_at_iso as createdAtIso FROM workout_templates ORDER BY weekday ASC, created_at_iso ASC"
  );
}

export async function getTemplateByWeekday(weekday: Weekday): Promise<WorkoutTemplate | null> {
  return (
    (await db.getFirstAsync<WorkoutTemplate>(
      "SELECT id, name, muscle_group as muscleGroup, weekday, created_at_iso as createdAtIso FROM workout_templates WHERE weekday = ? LIMIT 1",
      weekday
    )) ?? null
  );
}

export async function getTemplateExercises(templateId: string): Promise<TemplateExercise[]> {
  return db.getAllAsync<TemplateExercise>(
    "SELECT id, template_id as templateId, exercise_name as exerciseName, sets, reps, image_key as imageKey FROM template_exercises WHERE template_id = ? ORDER BY rowid ASC",
    templateId
  );
}

export async function createTemplate(name: string, muscleGroup: string, weekday: Weekday): Promise<string> {
  await db.runAsync("DELETE FROM workout_templates WHERE weekday = ?", weekday);
  const templateId = cryptoRandomId();
  await db.runAsync(
    "INSERT INTO workout_templates (id, name, muscle_group, weekday, created_at_iso) VALUES (?, ?, ?, ?, ?)",
    templateId,
    name.trim(),
    muscleGroup.trim(),
    weekday,
    new Date().toISOString()
  );
  return templateId;
}

export async function addExerciseToTemplate(templateId: string, exerciseName: string, sets: number, reps: number, imageKey: string) {
  await db.runAsync(
    "INSERT INTO template_exercises (id, template_id, exercise_name, sets, reps, image_key) VALUES (?, ?, ?, ?, ?, ?)",
    cryptoRandomId(),
    templateId,
    exerciseName.trim(),
    sets,
    reps,
    imageKey
  );
}

export async function clearTemplateExercises(templateId: string) {
  await db.runAsync("DELETE FROM template_exercises WHERE template_id = ?", templateId);
}

export async function getTodayTemplate(): Promise<{ template: WorkoutTemplate | null; exercises: TemplateExercise[] }> {
  const weekday = new Date().getDay() as Weekday;
  const template = await getTemplateByWeekday(weekday);
  if (!template) {
    return { template: null, exercises: [] };
  }
  const exercises = await getTemplateExercises(template.id);
  return { template, exercises };
}

export async function exportBackupPayload(): Promise<CloudBackupPayload> {
  const [workouts, achievements, profile, templates, exerciseLibrary] = await Promise.all([
    getAllSessions(),
    getAchievements(),
    getProfileOrNull(),
    getTemplates(),
    getExerciseLibrary()
  ]);

  const templateExercises: TemplateExercise[] = [];
  for (const template of templates) {
    const entries = await getTemplateExercises(template.id);
    templateExercises.push(...entries);
  }

  return {
    workouts,
    achievements,
    profile,
    templates,
    templateExercises,
    exerciseLibrary
  };
}

export async function importBackupPayload(payload: CloudBackupPayload) {
  await db.execAsync(`
    DELETE FROM exercises;
    DELETE FROM workout_sessions;
    DELETE FROM achievements;
    DELETE FROM template_exercises;
    DELETE FROM workout_templates;
    DELETE FROM exercise_library;
  `);

  if (payload.profile) {
    await db.execAsync("DELETE FROM user_profile;");
    await db.runAsync(
      "INSERT INTO user_profile (id, display_name, current_streak, last_checkin_at_iso) VALUES (?, ?, ?, ?)",
      payload.profile.id,
      payload.profile.displayName,
      payload.profile.currentStreak,
      payload.profile.lastCheckInAtIso
    );
  }

  for (const item of payload.workouts) {
    await db.runAsync(
      "INSERT INTO workout_sessions (id, date_iso, checked_in_at_iso, notes) VALUES (?, ?, ?, ?)",
      item.id,
      item.dateIso,
      item.checkedInAtIso,
      item.notes ?? ""
    );
    for (const exercise of item.exercises) {
      await db.runAsync(
        "INSERT INTO exercises (id, session_id, name, sets, reps, weight_kg, intensity, image_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        exercise.id,
        item.id,
        exercise.name,
        exercise.sets,
        exercise.reps,
        exercise.weightKg,
        exercise.intensity,
        exercise.imageKey
      );
    }
  }

  for (const item of payload.achievements) {
    await insertAchievement(item);
  }

  for (const item of payload.templates) {
    await db.runAsync(
      "INSERT INTO workout_templates (id, name, muscle_group, weekday, created_at_iso) VALUES (?, ?, ?, ?, ?)",
      item.id,
      item.name,
      item.muscleGroup,
      item.weekday,
      item.createdAtIso
    );
  }

  for (const item of payload.templateExercises) {
    await db.runAsync(
      "INSERT INTO template_exercises (id, template_id, exercise_name, sets, reps, image_key) VALUES (?, ?, ?, ?, ?, ?)",
      item.id,
      item.templateId,
      item.exerciseName,
      item.sets,
      item.reps,
      item.imageKey
    );
  }

  for (const item of payload.exerciseLibrary) {
    await db.runAsync(
      "INSERT INTO exercise_library (id, name, image_key, created_at_iso) VALUES (?, ?, ?, ?)",
      item.id,
      item.name,
      item.imageKey,
      item.createdAtIso
    );
  }
}

async function getWorkoutByDate(dateIso: string): Promise<WorkoutWithExercises | null> {
  const session = await db.getFirstAsync<WorkoutSession>(
    "SELECT id, date_iso as dateIso, checked_in_at_iso as checkedInAtIso, notes FROM workout_sessions WHERE date_iso = ? LIMIT 1",
    dateIso
  );
  if (!session) {
    return null;
  }
  const exercises = await getExercisesBySessionId(session.id);
  return { ...session, exercises };
}

async function getExercisesBySessionId(sessionId: string): Promise<Exercise[]> {
  return db.getAllAsync<Exercise>(
    "SELECT id, name, sets, reps, weight_kg as weightKg, intensity, image_key as imageKey FROM exercises WHERE session_id = ? ORDER BY rowid ASC",
    sessionId
  );
}

async function getProfileOrNull(): Promise<UserProfile | null> {
  return (
    (await db.getFirstAsync<UserProfile>(
      "SELECT id, display_name as displayName, current_streak as currentStreak, last_checkin_at_iso as lastCheckInAtIso FROM user_profile LIMIT 1"
    )) ?? null
  );
}

function isoDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function cryptoRandomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

