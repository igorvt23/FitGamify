import * as SQLite from "expo-sqlite";

import {
  Achievement,
  CloudBackupPayload,
  DifficultyLevel,
  Exercise,
  ExerciseSetLog,
  ExerciseLibraryItem,
  TemplateExercise,
  UserProfile,
  Weekday,
  WorkoutScheduleMode,
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
      date_iso TEXT NOT NULL,
      session_index INTEGER NOT NULL DEFAULT 0,
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
      planned_weight_kg REAL NOT NULL DEFAULT 0,
      weight_kg REAL NOT NULL DEFAULT 0,
      intensity REAL NOT NULL DEFAULT 5,
      is_completed INTEGER NOT NULL DEFAULT 0,
      image_key TEXT NOT NULL,
      set_logs TEXT NOT NULL DEFAULT '[]',
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
      assigned_weekdays TEXT NOT NULL DEFAULT '',
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
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  await runMigration();
  await ensureProfileExists();
  await ensureDefaultTemplates();
}

export async function getTodayWorkout(): Promise<WorkoutWithExercises | null> {
  const workouts = await getWorkoutsByDate(isoDateOnly(new Date()));
  return workouts[0] ?? null;
}

export async function createTodayWorkoutIfMissing() {
  const todayIso = isoDateOnly(new Date());
  const existing = await getWorkoutsByDate(todayIso);
  if (existing.length > 0) {
    return existing[0];
  }

  return createWorkoutForDate(todayIso);
}

export async function getTodayWorkouts(): Promise<WorkoutWithExercises[]> {
  return getWorkoutsByDate(isoDateOnly(new Date()));
}

export async function getScheduleMode(): Promise<WorkoutScheduleMode> {
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key = 'workout_schedule_mode' LIMIT 1");
  return row?.value === "weekday" ? "weekday" : "sequence";
}

export async function setScheduleMode(mode: WorkoutScheduleMode) {
  await db.runAsync(
    "INSERT INTO app_settings (key, value) VALUES ('workout_schedule_mode', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    mode
  );
}

export async function getSuggestedTemplatesForDate(dateIso: string): Promise<WorkoutTemplate[]> {
  const mode = await getScheduleMode();
  if (mode === "weekday") {
    const weekday = getWeekdayFromIsoDate(dateIso);
    const templates = await getTemplates();
    return templates.filter((item) => item.assignedWeekdays.includes(weekday));
  }

  const next = await getNextTemplateInSequence();
  return next ? [next] : [];
}

export async function createWorkoutForDate(dateIso: string, templateId?: string | null): Promise<WorkoutWithExercises> {
  const template = templateId ? await getTemplateById(templateId) : await resolveNextTemplateForDate(dateIso);
  const templateExercises = template ? await getTemplateExercises(template.id) : [];
  const sessionId = cryptoRandomId();
  const sessionIndex = await getNextSessionIndexForDate(dateIso);

  await db.runAsync(
    "INSERT INTO workout_sessions (id, date_iso, session_index, checked_in_at_iso, template_id, template_name, muscle_group, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    sessionId,
    dateIso,
    sessionIndex,
    null,
    template?.id ?? null,
    template?.name ?? null,
    template?.muscleGroup ?? null,
    ""
  );

  const fallbackExercises: Array<Omit<Exercise, "id">> = [
    {
      name: "Agachamento",
      repScheme: "4x10",
      plannedWeightKg: 0,
      weightKg: 0,
      intensity: 5,
      isCompleted: false,
      imageKey: "human-male-squat",
      setLogs: buildInitialSetLogs("4x10")
    },
    {
      name: "Supino",
      repScheme: "4x8",
      plannedWeightKg: 0,
      weightKg: 0,
      intensity: 5,
      isCompleted: false,
      imageKey: "human-male-board",
      setLogs: buildInitialSetLogs("4x8")
    },
    {
      name: "Remada",
      repScheme: "3x12",
      plannedWeightKg: 0,
      weightKg: 0,
      intensity: 5,
      isCompleted: false,
      imageKey: "rowing",
      setLogs: buildInitialSetLogs("3x12")
    }
  ];

  const sourceExercises =
    templateExercises.length > 0
      ? templateExercises.map((item) => ({
          name: item.exerciseName,
          repScheme: normalizeRepScheme(item.repScheme),
          plannedWeightKg: item.defaultWeightKg,
          weightKg: item.defaultWeightKg,
          intensity: 5,
          isCompleted: false,
          imageKey: item.imageKey,
          setLogs: buildInitialSetLogs(item.repScheme)
        }))
      : fallbackExercises;

  for (const entry of sourceExercises) {
    const latest = await getLatestExerciseMetricsByName(entry.name);
    await db.runAsync(
      "INSERT INTO exercises (id, session_id, name, rep_scheme, planned_weight_kg, weight_kg, intensity, is_completed, image_key, set_logs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      cryptoRandomId(),
      sessionId,
      entry.name,
      entry.repScheme,
      entry.plannedWeightKg,
      latest?.weightKg ?? entry.weightKg,
      latest?.intensity ?? getIntensityFromSetLogs(entry.setLogs) ?? entry.intensity,
      entry.isCompleted ? 1 : 0,
      entry.imageKey,
      JSON.stringify(entry.setLogs)
    );
  }

  const created = await getWorkoutById(sessionId);
  if (!created) {
    throw new Error("Nao foi possivel carregar o treino criado.");
  }
  return created;
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

export async function saveExerciseExecution(
  exerciseId: string,
  params: {
    weightKg: number;
    setLogs: ExerciseSetLog[];
    isCompleted: boolean;
  }
) {
  const normalizedSetLogs = normalizeSetLogs(params.setLogs);
  const intensity = getIntensityFromSetLogs(normalizedSetLogs) ?? 5;
  const exercise = await db.getFirstAsync<{ plannedWeightKg: number; name: string; sessionId: string }>(
    "SELECT planned_weight_kg as plannedWeightKg, name, session_id as sessionId FROM exercises WHERE id = ? LIMIT 1",
    exerciseId
  );

  await db.runAsync(
    "UPDATE exercises SET weight_kg = ?, intensity = ?, is_completed = ?, set_logs = ? WHERE id = ?",
    Math.max(0, params.weightKg),
    intensity,
    params.isCompleted ? 1 : 0,
    JSON.stringify(normalizedSetLogs),
    exerciseId
  );

  if (exercise && params.weightKg > exercise.plannedWeightKg) {
    const session = await db.getFirstAsync<{ templateId: string | null }>(
      "SELECT template_id as templateId FROM workout_sessions WHERE id = ? LIMIT 1",
      exercise.sessionId
    );
    if (session?.templateId) {
      await db.runAsync(
        "UPDATE template_exercises SET default_weight_kg = ? WHERE template_id = ? AND exercise_name = ?",
        Math.max(0, params.weightKg),
        session.templateId,
        exercise.name
      );
    }
  }
}

export async function checkInTodayWorkout(sessionId: string) {
  await db.runAsync("UPDATE workout_sessions SET checked_in_at_iso = ? WHERE id = ?", new Date().toISOString(), sessionId);
}

export async function getAllSessions(): Promise<WorkoutWithExercises[]> {
  const sessions = await db.getAllAsync<WorkoutSession>(
    "SELECT id, date_iso as dateIso, session_index as sessionIndex, checked_in_at_iso as checkedInAtIso, template_id as templateId, template_name as templateName, muscle_group as muscleGroup, notes FROM workout_sessions ORDER BY date_iso ASC, session_index ASC"
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
    "SELECT id, name, muscle_group as muscleGroup, order_index as orderIndex, assigned_weekdays as assignedWeekdaysRaw, created_at_iso as createdAtIso FROM workout_templates ORDER BY order_index ASC, created_at_iso ASC"
  ).then((rows) =>
    rows.map((item) => ({
      ...item,
      assignedWeekdays: parseWeekdays((item as WorkoutTemplate & { assignedWeekdaysRaw?: string }).assignedWeekdaysRaw)
    }))
  );
}

export async function getTemplateExercises(templateId: string): Promise<TemplateExercise[]> {
  return db.getAllAsync<TemplateExercise>(
    "SELECT id, template_id as templateId, exercise_name as exerciseName, rep_scheme as repScheme, default_weight_kg as defaultWeightKg, image_key as imageKey FROM template_exercises WHERE template_id = ? ORDER BY rowid ASC",
    templateId
  );
}

export async function createTemplate(name: string, muscleGroup: string, assignedWeekdays: Weekday[] = []): Promise<string> {
  const templates = await getTemplates();
  const templateId = cryptoRandomId();
  const orderIndex = templates.length;

  await db.runAsync(
    "INSERT INTO workout_templates (id, name, muscle_group, order_index, assigned_weekdays, created_at_iso) VALUES (?, ?, ?, ?, ?, ?)",
    templateId,
    name.trim(),
    muscleGroup.trim(),
    orderIndex,
    serializeWeekdays(assignedWeekdays),
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

export async function updateTemplate(templateId: string, name: string, muscleGroup: string, assignedWeekdays: Weekday[]) {
  await db.runAsync(
    "UPDATE workout_templates SET name = ?, muscle_group = ?, assigned_weekdays = ? WHERE id = ?",
    name.trim(),
    muscleGroup.trim(),
    serializeWeekdays(assignedWeekdays),
    templateId
  );
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
  const todayWorkouts = await getTodayWorkouts();
  if (todayWorkouts[0]?.templateId) {
    const template = await getTemplateById(todayWorkouts[0].templateId);
    if (template) {
      const exercises = await getTemplateExercises(template.id);
      return { template, exercises };
    }
  }

  const [template] = await getSuggestedTemplatesForDate(isoDateOnly(new Date()));
  if (!template) {
    return { template: null, exercises: [] };
  }
  const exercises = await getTemplateExercises(template.id);
  return { template, exercises };
}

export async function exportBackupPayload(): Promise<CloudBackupPayload> {
  const [workouts, achievements, profile, scheduleMode, templates, exerciseLibrary] = await Promise.all([
    getAllSessions(),
    getAchievements(),
    getProfileOrNull(),
    getScheduleMode(),
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
    scheduleMode,
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
      "INSERT INTO workout_sessions (id, date_iso, session_index, checked_in_at_iso, template_id, template_name, muscle_group, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      item.id,
      item.dateIso,
      item.sessionIndex ?? 0,
      item.checkedInAtIso,
      item.templateId ?? null,
      item.templateName ?? null,
      item.muscleGroup ?? null,
      item.notes ?? ""
    );
    for (const exercise of item.exercises) {
      await db.runAsync(
        "INSERT INTO exercises (id, session_id, name, rep_scheme, planned_weight_kg, weight_kg, intensity, is_completed, image_key, set_logs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        exercise.id,
        item.id,
        exercise.name,
        normalizeRepScheme(exercise.repScheme ?? legacyRepSchemeFromExercise(exercise as unknown as LegacyExercise)),
        exercise.plannedWeightKg ?? exercise.weightKg,
        exercise.weightKg,
        exercise.intensity,
        exercise.isCompleted ? 1 : 0,
        exercise.imageKey,
        JSON.stringify(normalizeSetLogs(exercise.setLogs ?? buildInitialSetLogs(exercise.repScheme)))
      );
    }
  }

  for (const item of payload.achievements) {
    await insertAchievement(item);
  }

  await setScheduleMode(payload.scheduleMode ?? "sequence");

  for (let index = 0; index < payload.templates.length; index += 1) {
    const item = payload.templates[index] as WorkoutTemplate & { weekday?: number };
    await db.runAsync(
      "INSERT INTO workout_templates (id, name, muscle_group, order_index, assigned_weekdays, created_at_iso) VALUES (?, ?, ?, ?, ?, ?)",
      item.id,
      item.name,
      item.muscleGroup,
      item.orderIndex ?? item.weekday ?? index,
      serializeWeekdays(item.assignedWeekdays ?? (typeof item.weekday === "number" ? [item.weekday as Weekday] : [])),
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

export async function getWorkoutsByDate(dateIso: string): Promise<WorkoutWithExercises[]> {
  const sessions = await db.getAllAsync<WorkoutSession>(
    "SELECT id, date_iso as dateIso, session_index as sessionIndex, checked_in_at_iso as checkedInAtIso, template_id as templateId, template_name as templateName, muscle_group as muscleGroup, notes FROM workout_sessions WHERE date_iso = ? ORDER BY session_index ASC",
    dateIso
  );
  const result: WorkoutWithExercises[] = [];
  for (const session of sessions) {
    const exercises = await getExercisesBySessionId(session.id);
    result.push({ ...session, exercises });
  }
  return result;
}

async function getWorkoutById(sessionId: string): Promise<WorkoutWithExercises | null> {
  const session = await db.getFirstAsync<WorkoutSession>(
    "SELECT id, date_iso as dateIso, session_index as sessionIndex, checked_in_at_iso as checkedInAtIso, template_id as templateId, template_name as templateName, muscle_group as muscleGroup, notes FROM workout_sessions WHERE id = ? LIMIT 1",
    sessionId
  );
  if (!session) {
    return null;
  }
  const exercises = await getExercisesBySessionId(session.id);
  return { ...session, exercises };
}

async function getExercisesBySessionId(sessionId: string): Promise<Exercise[]> {
  const rows = await db.getAllAsync<
    Omit<Exercise, "isCompleted" | "setLogs"> & {
      isCompleted: number;
      setLogsRaw: string;
    }
  >(
    "SELECT id, name, rep_scheme as repScheme, planned_weight_kg as plannedWeightKg, weight_kg as weightKg, intensity, is_completed as isCompleted, image_key as imageKey, set_logs as setLogsRaw FROM exercises WHERE session_id = ? ORDER BY rowid ASC",
    sessionId
  );
  return rows.map((entry) => ({
    ...entry,
    isCompleted: Boolean(entry.isCompleted),
    setLogs: parseSetLogs(entry.setLogsRaw, entry.repScheme)
  }));
}

async function getProfileOrNull(): Promise<UserProfile | null> {
  return (
    (await db.getFirstAsync<UserProfile>(
      "SELECT id, display_name as displayName, current_streak as currentStreak, last_checkin_at_iso as lastCheckInAtIso FROM user_profile LIMIT 1"
    )) ?? null
  );
}

async function getTemplateById(id: string): Promise<WorkoutTemplate | null> {
  const item =
    (await db.getFirstAsync<WorkoutTemplate & { assignedWeekdaysRaw?: string }>(
      "SELECT id, name, muscle_group as muscleGroup, order_index as orderIndex, assigned_weekdays as assignedWeekdaysRaw, created_at_iso as createdAtIso FROM workout_templates WHERE id = ? LIMIT 1",
      id
    )) ?? null;
  if (!item) {
    return null;
  }
  return { ...item, assignedWeekdays: parseWeekdays(item.assignedWeekdaysRaw) };
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

async function resolveNextTemplateForDate(dateIso: string): Promise<WorkoutTemplate | null> {
  const mode = await getScheduleMode();
  if (mode === "weekday") {
    const workouts = await getWorkoutsByDate(dateIso);
    const existingTemplateIds = new Set(workouts.map((item) => item.templateId).filter(Boolean));
    const suggested = await getSuggestedTemplatesForDate(dateIso);
    return suggested.find((item) => !existingTemplateIds.has(item.id)) ?? suggested[0] ?? null;
  }
  return getNextTemplateInSequence();
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
  await recreateWorkoutSessionsTableIfNeeded();

  // Columns added for old local databases.
  await addColumnIfMissing("workout_sessions", "template_id", "TEXT");
  await addColumnIfMissing("workout_sessions", "template_name", "TEXT");
  await addColumnIfMissing("workout_sessions", "muscle_group", "TEXT");
  await addColumnIfMissing("workout_sessions", "session_index", "INTEGER NOT NULL DEFAULT 0");
  await addColumnIfMissing("workout_templates", "order_index", "INTEGER NOT NULL DEFAULT 0");
  await addColumnIfMissing("workout_templates", "assigned_weekdays", "TEXT NOT NULL DEFAULT ''");
  await addColumnIfMissing("template_exercises", "rep_scheme", "TEXT NOT NULL DEFAULT '4x10'");
  await addColumnIfMissing("template_exercises", "default_weight_kg", "REAL NOT NULL DEFAULT 0");
  await addColumnIfMissing("exercises", "rep_scheme", "TEXT NOT NULL DEFAULT '4x10'");
  await addColumnIfMissing("exercises", "planned_weight_kg", "REAL NOT NULL DEFAULT 0");
  await addColumnIfMissing("exercises", "is_completed", "INTEGER NOT NULL DEFAULT 0");
  await addColumnIfMissing("exercises", "set_logs", "TEXT NOT NULL DEFAULT '[]'");

  // Copy legacy sets/reps into rep_scheme if needed.
  await db.runAsync(
    "UPDATE exercises SET rep_scheme = CAST(sets AS TEXT) || 'x' || CAST(reps AS TEXT) WHERE (rep_scheme IS NULL OR rep_scheme = '' OR rep_scheme = '4x10') AND sets IS NOT NULL AND reps IS NOT NULL"
  ).catch(() => undefined);
  await db.runAsync("UPDATE exercises SET planned_weight_kg = weight_kg WHERE planned_weight_kg IS NULL OR planned_weight_kg = 0").catch(() => undefined);
  await db.runAsync(
    "UPDATE template_exercises SET rep_scheme = CAST(sets AS TEXT) || 'x' || CAST(reps AS TEXT) WHERE (rep_scheme IS NULL OR rep_scheme = '' OR rep_scheme = '4x10') AND sets IS NOT NULL AND reps IS NOT NULL"
  ).catch(() => undefined);
  await backfillExerciseSetLogs();

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

  await setScheduleMode(await getScheduleMode());
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

async function backfillExerciseSetLogs() {
  const rows = await db.getAllAsync<{ id: string; repScheme: string; setLogsRaw: string | null }>(
    "SELECT id, rep_scheme as repScheme, set_logs as setLogsRaw FROM exercises"
  );
  for (const item of rows) {
    const parsed = parseSetLogs(item.setLogsRaw, item.repScheme);
    await db.runAsync("UPDATE exercises SET set_logs = ? WHERE id = ?", JSON.stringify(parsed), item.id);
  }
}

async function recreateWorkoutSessionsTableIfNeeded() {
  const indexes = await db.getAllAsync<{ name: string; unique: number }>("PRAGMA index_list(workout_sessions)");
  let hasDateUniqueIndex = false;
  for (const item of indexes) {
    if (!item.unique) {
      continue;
    }
    const columns = await db.getAllAsync<{ name: string }>(`PRAGMA index_info(${item.name})`);
    if (columns.some((column) => column.name === "date_iso")) {
      hasDateUniqueIndex = true;
      break;
    }
  }
  if (!hasDateUniqueIndex) {
    return;
  }

  await db.execAsync(`
    ALTER TABLE workout_sessions RENAME TO workout_sessions_legacy;
    CREATE TABLE workout_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      date_iso TEXT NOT NULL,
      session_index INTEGER NOT NULL DEFAULT 0,
      checked_in_at_iso TEXT,
      template_id TEXT,
      template_name TEXT,
      muscle_group TEXT,
      notes TEXT
    );
    INSERT INTO workout_sessions (id, date_iso, session_index, checked_in_at_iso, template_id, template_name, muscle_group, notes)
    SELECT id, date_iso, 0, checked_in_at_iso, template_id, template_name, muscle_group, notes
    FROM workout_sessions_legacy;
    DROP TABLE workout_sessions_legacy;
  `);
}

async function getNextSessionIndexForDate(dateIso: string) {
  const row =
    (await db.getFirstAsync<{ nextIndex: number }>(
      "SELECT COALESCE(MAX(session_index), -1) + 1 as nextIndex FROM workout_sessions WHERE date_iso = ?",
      dateIso
    )) ?? { nextIndex: 0 };
  return row.nextIndex;
}

function serializeWeekdays(weekdays: Weekday[]) {
  return [...new Set(weekdays)].sort((a, b) => a - b).join(",");
}

function parseWeekdays(raw: string | null | undefined): Weekday[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((item) => Number(item))
    .filter((item): item is Weekday => Number.isInteger(item) && item >= 0 && item <= 6);
}

function getWeekdayFromIsoDate(dateIso: string): Weekday {
  return new Date(`${dateIso}T12:00:00`).getDay() as Weekday;
}

function normalizeRepScheme(value: string | null | undefined) {
  const normalized = (value ?? "").replace(/\s+/g, "");
  return normalized.length > 0 ? normalized : "4x10";
}

function buildInitialSetLogs(repScheme: string | null | undefined): ExerciseSetLog[] {
  const normalized = normalizeRepScheme(repScheme);
  const chunks = normalized.split(",");
  const result: ExerciseSetLog[] = [];
  for (const chunk of chunks) {
    const [setsRaw, repsRaw] = chunk.trim().toLowerCase().split("x");
    const sets = Number(setsRaw);
    const reps = Number(repsRaw);
    if (Number.isNaN(sets) || Number.isNaN(reps) || sets <= 0 || reps <= 0) {
      continue;
    }
    for (let index = 0; index < sets; index += 1) {
      result.push({ targetReps: reps, actualReps: null, difficulty: null });
    }
  }
  return result.length > 0 ? result : [{ targetReps: 10, actualReps: null, difficulty: null }];
}

function normalizeSetLogs(setLogs: ExerciseSetLog[]): ExerciseSetLog[] {
  return setLogs.map((item) => ({
    targetReps: Math.max(0, Number(item.targetReps) || 0),
    actualReps: item.actualReps == null ? null : Math.max(0, Number(item.actualReps) || 0),
    difficulty: normalizeDifficulty(item.difficulty)
  }));
}

function parseSetLogs(raw: string | null | undefined, repScheme: string): ExerciseSetLog[] {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    if (Array.isArray(parsed) && parsed.length > 0) {
      return normalizeSetLogs(parsed as ExerciseSetLog[]);
    }
  } catch {
    return buildInitialSetLogs(repScheme);
  }
  return buildInitialSetLogs(repScheme);
}

function normalizeDifficulty(value: DifficultyLevel | string | null | undefined): DifficultyLevel | null {
  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }
  return null;
}

function getIntensityFromSetLogs(setLogs: ExerciseSetLog[]): number | null {
  const values = setLogs
    .map((item) => {
      if (item.difficulty === "easy") {
        return 3;
      }
      if (item.difficulty === "medium") {
        return 6;
      }
      if (item.difficulty === "hard") {
        return 9;
      }
      return null;
    })
    .filter((item): item is 3 | 6 | 9 => item !== null);
  if (values.length === 0) {
    return null;
  }
  return values.reduce((acc, item) => acc + item, 0) / values.length;
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
