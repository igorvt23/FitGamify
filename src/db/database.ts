import * as SQLite from "expo-sqlite";

import {
  Achievement,
  CloudBackupPayload,
  Exercise,
  ExerciseLibraryItem,
  TemplateExercise,
  UserProfile,
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
      template_id TEXT,
      template_name TEXT,
      muscle_group TEXT,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      name TEXT NOT NULL,
      rep_scheme TEXT NOT NULL DEFAULT '4x10',
      weight_kg REAL NOT NULL DEFAULT 0,
      intensity REAL NOT NULL DEFAULT 5,
      is_completed INTEGER NOT NULL DEFAULT 0,
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
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at_iso TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS template_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      template_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      rep_scheme TEXT NOT NULL DEFAULT '4x10',
      default_weight_kg REAL NOT NULL DEFAULT 0,
      image_key TEXT NOT NULL,
      FOREIGN KEY(template_id) REFERENCES workout_templates(id) ON DELETE CASCADE
    );
  `);

  await runMigration();
  await ensureProfileExists();
  await ensureDefaultTemplates();
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

  const nextTemplate = await getNextTemplateInSequence();
  const templateExercises = nextTemplate ? await getTemplateExercises(nextTemplate.id) : [];
  const sessionId = cryptoRandomId();

  await db.runAsync(
    "INSERT INTO workout_sessions (id, date_iso, checked_in_at_iso, template_id, template_name, muscle_group, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
    sessionId,
    todayIso,
    null,
    nextTemplate?.id ?? null,
    nextTemplate?.name ?? null,
    nextTemplate?.muscleGroup ?? null,
    ""
  );

  const fallbackExercises: Array<Omit<Exercise, "id">> = [
    { name: "Agachamento", repScheme: "4x10", weightKg: 0, intensity: 5, isCompleted: false, imageKey: "human-male-squat" },
    { name: "Supino", repScheme: "4x8", weightKg: 0, intensity: 5, isCompleted: false, imageKey: "human-male-board" },
    { name: "Remada", repScheme: "3x12", weightKg: 0, intensity: 5, isCompleted: false, imageKey: "rowing" }
  ];

  const sourceExercises =
    templateExercises.length > 0
      ? templateExercises.map((item) => ({
          name: item.exerciseName,
          repScheme: normalizeRepScheme(item.repScheme),
          weightKg: item.defaultWeightKg,
          intensity: 5,
          isCompleted: false,
          imageKey: item.imageKey
        }))
      : fallbackExercises;

  for (const entry of sourceExercises) {
    const latest = await getLatestExerciseMetricsByName(entry.name);
    await db.runAsync(
      "INSERT INTO exercises (id, session_id, name, rep_scheme, weight_kg, intensity, is_completed, image_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      cryptoRandomId(),
      sessionId,
      entry.name,
      entry.repScheme,
      latest?.weightKg ?? entry.weightKg,
      latest?.intensity ?? entry.intensity,
      entry.isCompleted ? 1 : 0,
      entry.imageKey
    );
  }

  return getWorkoutByDate(todayIso);
}

export async function updateExerciseMetrics(exerciseId: string, weightKg: number, intensity: number, isCompleted: boolean) {
  await db.runAsync(
    "UPDATE exercises SET weight_kg = ?, intensity = ?, is_completed = ? WHERE id = ?",
    weightKg,
    intensity,
    isCompleted ? 1 : 0,
    exerciseId
  );
}

export async function checkInTodayWorkout(sessionId: string) {
  await db.runAsync("UPDATE workout_sessions SET checked_in_at_iso = ? WHERE id = ?", new Date().toISOString(), sessionId);
}

export async function getAllSessions(): Promise<WorkoutWithExercises[]> {
  const sessions = await db.getAllAsync<WorkoutSession>(
    "SELECT id, date_iso as dateIso, checked_in_at_iso as checkedInAtIso, template_id as templateId, template_name as templateName, muscle_group as muscleGroup, notes FROM workout_sessions ORDER BY date_iso ASC"
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
    "SELECT id, name, muscle_group as muscleGroup, order_index as orderIndex, created_at_iso as createdAtIso FROM workout_templates ORDER BY order_index ASC, created_at_iso ASC"
  );
}

export async function getTemplateExercises(templateId: string): Promise<TemplateExercise[]> {
  return db.getAllAsync<TemplateExercise>(
    "SELECT id, template_id as templateId, exercise_name as exerciseName, rep_scheme as repScheme, default_weight_kg as defaultWeightKg, image_key as imageKey FROM template_exercises WHERE template_id = ? ORDER BY rowid ASC",
    templateId
  );
}

export async function createTemplate(name: string, muscleGroup: string): Promise<string> {
  const templates = await getTemplates();
  const templateId = cryptoRandomId();
  const orderIndex = templates.length;

  await db.runAsync(
    "INSERT INTO workout_templates (id, name, muscle_group, order_index, created_at_iso) VALUES (?, ?, ?, ?, ?)",
    templateId,
    name.trim(),
    muscleGroup.trim(),
    orderIndex,
    new Date().toISOString()
  );
  return templateId;
}

export async function addExerciseToTemplate(templateId: string, exerciseName: string, repScheme: string, imageKey: string) {
  await addExerciseToTemplateWithWeight(templateId, exerciseName, repScheme, 0, imageKey);
}

export async function addExerciseToTemplateWithWeight(
  templateId: string,
  exerciseName: string,
  repScheme: string,
  defaultWeightKg: number,
  imageKey: string
) {
  await db.runAsync(
    "INSERT INTO template_exercises (id, template_id, exercise_name, rep_scheme, default_weight_kg, image_key) VALUES (?, ?, ?, ?, ?, ?)",
    cryptoRandomId(),
    templateId,
    exerciseName.trim(),
    normalizeRepScheme(repScheme),
    Math.max(0, defaultWeightKg),
    imageKey
  );
}

export async function updateTemplate(templateId: string, name: string, muscleGroup: string) {
  await db.runAsync("UPDATE workout_templates SET name = ?, muscle_group = ? WHERE id = ?", name.trim(), muscleGroup.trim(), templateId);
}

export async function deleteTemplate(templateId: string) {
  await db.runAsync("DELETE FROM workout_templates WHERE id = ?", templateId);
  await normalizeTemplateOrder();
}

export async function updateTemplateExercise(
  exerciseId: string,
  params: {
    exerciseName: string;
    repScheme: string;
    defaultWeightKg: number;
    imageKey: string;
  }
) {
  await db.runAsync(
    "UPDATE template_exercises SET exercise_name = ?, rep_scheme = ?, default_weight_kg = ?, image_key = ? WHERE id = ?",
    params.exerciseName.trim(),
    normalizeRepScheme(params.repScheme),
    Math.max(0, params.defaultWeightKg),
    params.imageKey,
    exerciseId
  );
}

export async function deleteTemplateExercise(exerciseId: string) {
  await db.runAsync("DELETE FROM template_exercises WHERE id = ?", exerciseId);
}

export async function clearTemplateExercises(templateId: string) {
  await db.runAsync("DELETE FROM template_exercises WHERE template_id = ?", templateId);
}

export async function reorderTemplate(templateId: string, direction: "up" | "down") {
  const templates = await getTemplates();
  const currentIndex = templates.findIndex((item) => item.id === templateId);
  if (currentIndex < 0) {
    return;
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= templates.length) {
    return;
  }

  const reordered = [...templates];
  const [moved] = reordered.splice(currentIndex, 1);
  reordered.splice(targetIndex, 0, moved);
  await persistTemplateOrder(reordered);
}

export async function getTodayTemplate(): Promise<{ template: WorkoutTemplate | null; exercises: TemplateExercise[] }> {
  const todayWorkout = await getTodayWorkout();
  if (todayWorkout?.templateId) {
    const template = await getTemplateById(todayWorkout.templateId);
    if (template) {
      const exercises = await getTemplateExercises(template.id);
      return { template, exercises };
    }
  }

  const template = await getNextTemplateInSequence();
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
      "INSERT INTO workout_sessions (id, date_iso, checked_in_at_iso, template_id, template_name, muscle_group, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      item.id,
      item.dateIso,
      item.checkedInAtIso,
      item.templateId ?? null,
      item.templateName ?? null,
      item.muscleGroup ?? null,
      item.notes ?? ""
    );
    for (const exercise of item.exercises) {
      await db.runAsync(
        "INSERT INTO exercises (id, session_id, name, rep_scheme, weight_kg, intensity, is_completed, image_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        exercise.id,
        item.id,
        exercise.name,
        normalizeRepScheme(exercise.repScheme ?? legacyRepSchemeFromExercise(exercise as unknown as LegacyExercise)),
        exercise.weightKg,
        exercise.intensity,
        exercise.isCompleted ? 1 : 0,
        exercise.imageKey
      );
    }
  }

  for (const item of payload.achievements) {
    await insertAchievement(item);
  }

  for (let index = 0; index < payload.templates.length; index += 1) {
    const item = payload.templates[index] as WorkoutTemplate & { weekday?: number };
    await db.runAsync(
      "INSERT INTO workout_templates (id, name, muscle_group, order_index, created_at_iso) VALUES (?, ?, ?, ?, ?)",
      item.id,
      item.name,
      item.muscleGroup,
      item.orderIndex ?? item.weekday ?? index,
      item.createdAtIso
    );
  }

  for (const item of payload.templateExercises) {
    const legacyItem = item as TemplateExercise & { sets?: number; reps?: number; defaultWeightKg?: number };
    await db.runAsync(
      "INSERT INTO template_exercises (id, template_id, exercise_name, rep_scheme, default_weight_kg, image_key) VALUES (?, ?, ?, ?, ?, ?)",
      item.id,
      item.templateId,
      item.exerciseName,
      normalizeRepScheme(item.repScheme ?? `${legacyItem.sets ?? 4}x${legacyItem.reps ?? 10}`),
      item.defaultWeightKg ?? legacyItem.defaultWeightKg ?? 0,
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

  await normalizeTemplateOrder();
  await ensureDefaultTemplates();
}

async function getWorkoutByDate(dateIso: string): Promise<WorkoutWithExercises | null> {
  const session = await db.getFirstAsync<WorkoutSession>(
    "SELECT id, date_iso as dateIso, checked_in_at_iso as checkedInAtIso, template_id as templateId, template_name as templateName, muscle_group as muscleGroup, notes FROM workout_sessions WHERE date_iso = ? LIMIT 1",
    dateIso
  );
  if (!session) {
    return null;
  }
  const exercises = await getExercisesBySessionId(session.id);
  return { ...session, exercises };
}

async function getExercisesBySessionId(sessionId: string): Promise<Exercise[]> {
  const rows = await db.getAllAsync<
    Omit<Exercise, "isCompleted"> & {
      isCompleted: number;
    }
  >(
    "SELECT id, name, rep_scheme as repScheme, weight_kg as weightKg, intensity, is_completed as isCompleted, image_key as imageKey FROM exercises WHERE session_id = ? ORDER BY rowid ASC",
    sessionId
  );
  return rows.map((entry) => ({ ...entry, isCompleted: Boolean(entry.isCompleted) }));
}

async function getProfileOrNull(): Promise<UserProfile | null> {
  return (
    (await db.getFirstAsync<UserProfile>(
      "SELECT id, display_name as displayName, current_streak as currentStreak, last_checkin_at_iso as lastCheckInAtIso FROM user_profile LIMIT 1"
    )) ?? null
  );
}

async function getTemplateById(id: string): Promise<WorkoutTemplate | null> {
  return (
    (await db.getFirstAsync<WorkoutTemplate>(
      "SELECT id, name, muscle_group as muscleGroup, order_index as orderIndex, created_at_iso as createdAtIso FROM workout_templates WHERE id = ? LIMIT 1",
      id
    )) ?? null
  );
}

async function getNextTemplateInSequence(): Promise<WorkoutTemplate | null> {
  const templates = await getTemplates();
  if (templates.length === 0) {
    return null;
  }

  const lastSessionWithTemplate = await db.getFirstAsync<{ templateId: string | null }>(
    "SELECT template_id as templateId FROM workout_sessions WHERE template_id IS NOT NULL ORDER BY date_iso DESC LIMIT 1"
  );

  if (!lastSessionWithTemplate?.templateId) {
    return templates[0];
  }

  const currentIndex = templates.findIndex((item) => item.id === lastSessionWithTemplate.templateId);
  if (currentIndex < 0) {
    return templates[0];
  }
  return templates[(currentIndex + 1) % templates.length];
}

async function persistTemplateOrder(items: WorkoutTemplate[]) {
  for (let index = 0; index < items.length; index += 1) {
    await db.runAsync("UPDATE workout_templates SET order_index = ? WHERE id = ?", index, items[index].id);
  }
}

async function normalizeTemplateOrder() {
  const templates = await getTemplates();
  await persistTemplateOrder(templates);
}

async function ensureProfileExists() {
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

async function ensureDefaultTemplates() {
  const templates = await getTemplates();
  if (templates.length > 0) {
    return;
  }

  const defaults = [
    {
      name: "Treino A",
      muscleGroup: "Peito e Triceps",
      exercises: [
        { exerciseName: "Supino Reto", repScheme: "4x10", imageKey: "human-male-board" },
        { exerciseName: "Supino Inclinado", repScheme: "3x12", imageKey: "dumbbell" },
        { exerciseName: "Triceps Corda", repScheme: "3x12", imageKey: "arm-flex" }
      ]
    },
    {
      name: "Treino B",
      muscleGroup: "Costas e Biceps",
      exercises: [
        { exerciseName: "Puxada Frontal", repScheme: "4x10", imageKey: "arm-flex-outline" },
        { exerciseName: "Remada Curvada", repScheme: "3x12", imageKey: "rowing" },
        { exerciseName: "Rosca Direta", repScheme: "3x12", imageKey: "arm-flex" }
      ]
    },
    {
      name: "Treino C",
      muscleGroup: "Pernas",
      exercises: [
        { exerciseName: "Agachamento", repScheme: "4x10", imageKey: "human-male-squat" },
        { exerciseName: "Leg Press", repScheme: "4x12", imageKey: "weight-lifter" },
        { exerciseName: "Cadeira Extensora", repScheme: "3x15", imageKey: "human" }
      ]
    }
  ];

  for (const item of defaults) {
    const templateId = await createTemplate(item.name, item.muscleGroup);
    for (const exercise of item.exercises) {
      await addExerciseToTemplate(templateId, exercise.exerciseName, exercise.repScheme, exercise.imageKey);
    }
  }
}

async function runMigration() {
  // Columns added for old local databases.
  await addColumnIfMissing("workout_sessions", "template_id", "TEXT");
  await addColumnIfMissing("workout_sessions", "template_name", "TEXT");
  await addColumnIfMissing("workout_sessions", "muscle_group", "TEXT");
  await addColumnIfMissing("workout_templates", "order_index", "INTEGER NOT NULL DEFAULT 0");
  await addColumnIfMissing("template_exercises", "rep_scheme", "TEXT NOT NULL DEFAULT '4x10'");
  await addColumnIfMissing("template_exercises", "default_weight_kg", "REAL NOT NULL DEFAULT 0");
  await addColumnIfMissing("exercises", "rep_scheme", "TEXT NOT NULL DEFAULT '4x10'");
  await addColumnIfMissing("exercises", "is_completed", "INTEGER NOT NULL DEFAULT 0");

  // Copy legacy sets/reps into rep_scheme if needed.
  await db.runAsync(
    "UPDATE exercises SET rep_scheme = CAST(sets AS TEXT) || 'x' || CAST(reps AS TEXT) WHERE (rep_scheme IS NULL OR rep_scheme = '' OR rep_scheme = '4x10') AND sets IS NOT NULL AND reps IS NOT NULL"
  ).catch(() => undefined);
  await db.runAsync(
    "UPDATE template_exercises SET rep_scheme = CAST(sets AS TEXT) || 'x' || CAST(reps AS TEXT) WHERE (rep_scheme IS NULL OR rep_scheme = '' OR rep_scheme = '4x10') AND sets IS NOT NULL AND reps IS NOT NULL"
  ).catch(() => undefined);

  // Migrate legacy weekday ordering into sequence ordering when possible.
  const tableInfo = await db.getAllAsync<{ name: string }>("PRAGMA table_info(workout_templates)");
  const hasWeekday = tableInfo.some((col) => col.name === "weekday");
  if (hasWeekday) {
    const legacy = await db.getAllAsync<{ id: string; weekday: number; createdAtIso: string }>(
      "SELECT id, weekday, created_at_iso as createdAtIso FROM workout_templates ORDER BY weekday ASC, created_at_iso ASC"
    );
    for (let index = 0; index < legacy.length; index += 1) {
      await db.runAsync("UPDATE workout_templates SET order_index = ? WHERE id = ?", index, legacy[index].id);
    }
  } else {
    await normalizeTemplateOrder();
  }
}

async function addColumnIfMissing(tableName: string, columnName: string, definition: string) {
  const tableInfo = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);
  const hasColumn = tableInfo.some((col) => col.name === columnName);
  if (hasColumn) {
    return;
  }
  await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition};`);
}

async function getLatestExerciseMetricsByName(name: string): Promise<{ weightKg: number; intensity: number } | null> {
  return (
    (await db.getFirstAsync<{ weightKg: number; intensity: number }>(
      "SELECT e.weight_kg as weightKg, e.intensity as intensity FROM exercises e INNER JOIN workout_sessions w ON w.id = e.session_id WHERE e.name = ? ORDER BY w.date_iso DESC LIMIT 1",
      name
    )) ?? null
  );
}

function normalizeRepScheme(value: string | null | undefined) {
  const normalized = (value ?? "").replace(/\s+/g, "");
  return normalized.length > 0 ? normalized : "4x10";
}

function isoDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function cryptoRandomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

type LegacyExercise = {
  sets?: number;
  reps?: number;
};

function legacyRepSchemeFromExercise(entry: LegacyExercise) {
  return `${entry.sets ?? 4}x${entry.reps ?? 10}`;
}
