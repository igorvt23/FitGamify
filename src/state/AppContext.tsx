import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, useColorScheme } from "react-native";

import { resolveNewAchievements } from "../core/gamification";
import { calculateUpdatedStreak, reconcileStreakAfterMissedDay } from "../core/streak";
import { normalizeFitnessGoal } from "../core/fitnessGoal";
import {
  addExerciseToTemplateWithWeight,
  checkInTodayWorkout,
  clearTemplateExercises,
  createExerciseLibraryItem,
  createTemplate,
  createTodayWorkoutIfMissing,
  createWorkoutForDate,
  deleteTemplate,
  deleteTemplateExercise,
  exportBackupPayload,
  getAchievements,
  getAllSessions,
  getExerciseLibrary,
  getProfile,
  getRecentErrors,
  getWorkoutReminderSettings,
  getScheduleMode,
  getSuggestedTemplatesForDate,
  getTemplateExercises,
  getTemplates,
  getTodayTemplate,
  getTodayWorkout,
  getTodayWorkouts,
  importBackupPayload,
  insertAchievement,
  logError,
  reorderTemplate,
  saveExerciseExecution,
  setWorkoutReminderSettings as saveWorkoutReminderSettings,
  setScheduleMode,
  setWorkoutIntensity,
  setTemplateActive,
  setTemplateExerciseActive,
  updateProfileDisplayName,
  updateProfileDetails,
  updateProfileStreak,
  updateTemplate,
  updateTemplateExercise
} from "../db/database";
import { applyWorkoutReminderSchedule, sendMotivationalNotification } from "../services/notifications";
import {
  getCurrentAuthUser,
  getUserProfile,
  sendPasswordResetEmail,
  signInWithEmail,
  signOutCloud,
  signUpWithEmail,
  upsertUserProfile
} from "../services/auth";
import { pullBackup, pushBackup } from "../services/cloudBackup";
import {
  Achievement,
  AppLanguage,
  AppTheme,
  AuthUser,
  ExerciseLibraryItem,
  FitnessGoal,
  SignUpInput,
  TemplateExercise,
  UserProfile,
  Weekday,
  ExerciseSetLog,
  WorkoutReminderSettings,
  WorkoutScheduleMode,
  WorkoutTemplate,
  WorkoutWithExercises
} from "../types";

type AppContextData = {
  loading: boolean;
  theme: AppTheme;
  language: AppLanguage;
  currentWorkout: WorkoutWithExercises | null;
  todayWorkouts: WorkoutWithExercises[];
  sessions: WorkoutWithExercises[];
  profile: UserProfile | null;
  achievements: Achievement[];
  errors: { id: string; category: string; message: string; createdAtIso: string }[];
  templates: WorkoutTemplate[];
  todayTemplate: WorkoutTemplate | null;
  todayTemplateExercises: TemplateExercise[];
  exerciseLibrary: ExerciseLibraryItem[];
  authUser: AuthUser | null;
  scheduleMode: WorkoutScheduleMode;
  workoutReminderSettings: WorkoutReminderSettings;
  suggestedTemplatesToday: WorkoutTemplate[];
  bootstrap: () => Promise<void>;
  ensureTodayWorkout: () => Promise<void>;
  createWorkoutFromTemplate: (templateId?: string | null) => Promise<void>;
  saveExercise: (params: { exerciseId: string; weightKg: number; setLogs: ExerciseSetLog[]; anxietyLevel: number | null; isCompleted: boolean }) => Promise<void>;
  doCheckIn: (translate: (key: string) => string, sessionId?: string, intensity?: number | null) => Promise<Achievement[]>;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: AppLanguage) => void;
  setWorkoutScheduleMode: (mode: WorkoutScheduleMode) => Promise<void>;
  createExerciseLibrary: (name: string, imageKey: string) => Promise<void>;
  saveTemplate: (params: {
    name: string;
    muscleGroup: string;
    assignedWeekdays: Weekday[];
    orderIndex?: number;
    exercises: Array<{ exerciseName: string; repScheme: string; defaultWeightLabel: string; imageKey: string }>;
  }) => Promise<void>;
  moveTemplate: (templateId: string, direction: "up" | "down") => Promise<void>;
  updateTemplateInfo: (templateId: string, name: string, muscleGroup: string, assignedWeekdays: Weekday[]) => Promise<void>;
  deleteTemplateById: (templateId: string) => Promise<void>;
  addExerciseToTemplateById: (params: {
    templateId: string;
    exerciseName: string;
    repScheme: string;
    defaultWeightLabel: string;
    imageKey: string;
  }) => Promise<void>;
  updateTemplateExerciseById: (params: {
    exerciseId: string;
    exerciseName: string;
    repScheme: string;
    defaultWeightLabel: string;
    imageKey: string;
  }) => Promise<void>;
  deleteTemplateExerciseById: (exerciseId: string) => Promise<void>;
  setTemplateActiveById: (templateId: string, isActive: boolean) => Promise<void>;
  setTemplateExerciseActiveById: (exerciseId: string, isActive: boolean) => Promise<void>;
  fetchTemplateExercises: (templateId: string, includeInactive?: boolean) => Promise<TemplateExercise[]>;
  signUp: (payload: SignUpInput) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  backupNow: () => Promise<void>;
  restoreBackupNow: () => Promise<void>;
  updateWorkoutReminderSettings: (settings: WorkoutReminderSettings) => Promise<void>;
  updateProfile: (params: {
    displayName?: string;
    fullName?: string | null;
    age?: number | null;
    heightCm?: number | null;
    weightKg?: number | null;
    goal?: FitnessGoal | null;
  }) => Promise<void>;
};

const AppContext = createContext<AppContextData | undefined>(undefined);
const DEFAULT_WORKOUT_REMINDER_SETTINGS: WorkoutReminderSettings = {
  enabled: false,
  hour: 20,
  minute: 0,
  weekdays: [1, 2, 3, 4, 5]
};

function todayIso() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function calculateIntensityFromSetLogs(setLogs: ExerciseSetLog[]) {
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

function areWorkoutReminderSettingsEqual(a: WorkoutReminderSettings, b: WorkoutReminderSettings) {
  if (a.enabled !== b.enabled || a.hour !== b.hour || a.minute !== b.minute) {
    return false;
  }
  if (a.weekdays.length !== b.weekdays.length) {
    return false;
  }
  for (let index = 0; index < a.weekdays.length; index += 1) {
    if (a.weekdays[index] !== b.weekdays[index]) {
      return false;
    }
  }
  return true;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const deviceTheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<AppTheme>(deviceTheme === "dark" ? "dark" : "light");
  const [language, setLanguage] = useState<AppLanguage>("pt-BR");
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutWithExercises | null>(null);
  const [todayWorkouts, setTodayWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [sessions, setSessions] = useState<WorkoutWithExercises[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [errors, setErrors] = useState<{ id: string; category: string; message: string; createdAtIso: string }[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [todayTemplate, setTodayTemplate] = useState<WorkoutTemplate | null>(null);
  const [todayTemplateExercises, setTodayTemplateExercises] = useState<TemplateExercise[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibraryItem[]>([]);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [scheduleMode, setScheduleModeState] = useState<WorkoutScheduleMode>("sequence");
  const [workoutReminderSettings, setWorkoutReminderSettingsState] = useState<WorkoutReminderSettings>(
    DEFAULT_WORKOUT_REMINDER_SETTINGS
  );
  const [suggestedTemplatesToday, setSuggestedTemplatesToday] = useState<WorkoutTemplate[]>([]);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackedDayRef = useRef(todayIso());

  const scheduleSync = useCallback(
    (delayMs = 2000) => {
      if (!authUser) {
        return;
      }
      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
      }
      syncTimer.current = setTimeout(() => {
        syncTimer.current = null;
        void (async () => {
          const payload = await exportBackupPayload();
          await pushBackup(authUser.id, payload);
        })();
      }, delayMs);
    },
    [authUser]
  );

  const applyExerciseUpdate = useCallback(
    (params: { exerciseId: string; weightKg: number; setLogs: ExerciseSetLog[]; anxietyLevel: number | null; isCompleted: boolean }) => {
      const intensity = calculateIntensityFromSetLogs(params.setLogs);
      const updateWorkout = (workout: WorkoutWithExercises) => ({
        ...workout,
        exercises: workout.exercises.map((exercise) =>
          exercise.id === params.exerciseId
            ? {
                ...exercise,
                weightKg: params.weightKg,
                setLogs: params.setLogs,
                anxietyLevel: params.anxietyLevel,
                isCompleted: params.isCompleted,
                intensity: intensity ?? exercise.intensity
              }
            : exercise
        )
      });

      setTodayWorkouts((prev) =>
        prev.map((session) => (session.exercises.some((exercise) => exercise.id === params.exerciseId) ? updateWorkout(session) : session))
      );
      setCurrentWorkout((prev) =>
        prev && prev.exercises.some((exercise) => exercise.id === params.exerciseId) ? updateWorkout(prev) : prev
      );
      setSessions((prev) =>
        prev.map((session) => (session.exercises.some((exercise) => exercise.id === params.exerciseId) ? updateWorkout(session) : session))
      );
    },
    []
  );

  const refreshAll = useCallback(async () => {
    const [
      today,
      todaySessions,
      allSessions,
      userProfile,
      unlockedAchievements,
      recentErrors,
      currentScheduleMode,
      reminderSettings,
      templatesList,
      todayTemplateData,
      library,
      sessionUser,
      todaySuggestions
    ] = await Promise.all([
      getTodayWorkout(),
      getTodayWorkouts(),
      getAllSessions(),
      getProfile(),
      getAchievements(),
      getRecentErrors(),
      getScheduleMode(),
      getWorkoutReminderSettings(),
      getTemplates(),
      getTodayTemplate(),
      getExerciseLibrary(),
      getCurrentAuthUser(),
      getSuggestedTemplatesForDate(todayIso())
    ]);

    const resolvedStreak = reconcileStreakAfterMissedDay(userProfile.currentStreak, userProfile.lastCheckInAtIso, new Date());
    const resolvedProfile =
      resolvedStreak === userProfile.currentStreak ? userProfile : { ...userProfile, currentStreak: resolvedStreak };

    if (resolvedStreak !== userProfile.currentStreak) {
      await updateProfileStreak(userProfile.id, resolvedStreak, userProfile.lastCheckInAtIso);
    }

    setCurrentWorkout(today);
    setTodayWorkouts(todaySessions);
    setSessions(allSessions);
    setProfile(resolvedProfile);
    setAchievements(unlockedAchievements);
    setErrors(recentErrors);
    setScheduleModeState(currentScheduleMode);
    setWorkoutReminderSettingsState((current) =>
      areWorkoutReminderSettingsEqual(current, reminderSettings) ? current : reminderSettings
    );
    setTemplates(templatesList);
    setTodayTemplate(todayTemplateData.template);
    setTodayTemplateExercises(todayTemplateData.exercises);
    setExerciseLibrary(library);
    setAuthUser(sessionUser);
    setSuggestedTemplatesToday(todaySuggestions);
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      await refreshAll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      await logError("bootstrap", message);
    } finally {
      setLoading(false);
    }
  }, [refreshAll]);

  useEffect(() => {
    void applyWorkoutReminderSchedule(workoutReminderSettings, language);
  }, [language, workoutReminderSettings]);

  const refreshIfDayChanged = useCallback(async () => {
    const currentDayIso = todayIso();
    if (trackedDayRef.current === currentDayIso) {
      return;
    }
    await refreshAll();
    trackedDayRef.current = currentDayIso;
  }, [refreshAll]);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshIfDayChanged();
      }
    });
    const dayCheckInterval = setInterval(() => {
      void refreshIfDayChanged();
    }, 60_000);

    return () => {
      appStateSubscription.remove();
      clearInterval(dayCheckInterval);
    };
  }, [refreshIfDayChanged]);

  const backupNow = useCallback(async () => {
    if (!authUser) {
      throw new Error("Voce precisa estar logado para fazer backup.");
    }
    const payload = await exportBackupPayload();
    await pushBackup(authUser.id, payload);
  }, [authUser]);

  const restoreBackupNow = useCallback(async () => {
    if (!authUser) {
      throw new Error("Voce precisa estar logado para restaurar backup.");
    }
    const backup = await pullBackup(authUser.id);
    if (!backup) {
      return;
    }
    await importBackupPayload(backup);
    await refreshAll();
  }, [authUser, refreshAll]);

  const updateWorkoutReminderSettings = useCallback(async (settings: WorkoutReminderSettings) => {
    await saveWorkoutReminderSettings(settings);
    const refreshed = await getWorkoutReminderSettings();
    setWorkoutReminderSettingsState(refreshed);
  }, []);

  const syncAfterChange = useCallback(async () => {
    scheduleSync();
  }, [scheduleSync]);

  const ensureTodayWorkout = useCallback(async () => {
    try {
      await createTodayWorkoutIfMissing();
      await refreshAll();
      await syncAfterChange();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar treino";
      await logError("ensure-workout", message);
      setErrors(await getRecentErrors());
    }
  }, [refreshAll, syncAfterChange]);

  const createWorkoutFromTemplate = useCallback(
    async (templateId?: string | null) => {
      try {
        await createWorkoutForDate(todayIso(), templateId);
        await refreshAll();
        await syncAfterChange();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao adicionar treino";
        await logError("create-workout", message);
        setErrors(await getRecentErrors());
      }
    },
    [refreshAll, syncAfterChange]
  );

  const saveExercise = useCallback(
    async (params: { exerciseId: string; weightKg: number; setLogs: ExerciseSetLog[]; anxietyLevel: number | null; isCompleted: boolean }) => {
      try {
        await saveExerciseExecution(params.exerciseId, {
          weightKg: params.weightKg,
          setLogs: params.setLogs,
          anxietyLevel: params.anxietyLevel,
          isCompleted: params.isCompleted
        });
        applyExerciseUpdate(params);
        scheduleSync();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao salvar exercicio";
        await logError("save-exercise", message);
        setErrors(await getRecentErrors());
      }
    },
    [applyExerciseUpdate, scheduleSync]
  );

  const doCheckIn = useCallback(
    async (translate: (key: string) => string, sessionId?: string, intensity?: number | null) => {
      const targetWorkout = sessionId ? todayWorkouts.find((item) => item.id === sessionId) ?? null : currentWorkout;
      if (!targetWorkout || !profile || targetWorkout.checkedInAtIso) {
        return [];
      }

      const nowIso = new Date().toISOString();

      try {
        if (intensity != null) {
          await setWorkoutIntensity(targetWorkout.id, intensity);
        }
        await checkInTodayWorkout(targetWorkout.id);
        const delta = calculateUpdatedStreak(profile.lastCheckInAtIso, new Date());
        const nextStreak = delta === -1 ? 1 : profile.currentStreak + delta;
        await updateProfileStreak(profile.id, nextStreak, nowIso);

        const updatedSessions = sessions.map((session) =>
          session.id === targetWorkout.id ? { ...session, checkedInAtIso: nowIso } : session
        );
        setSessions(updatedSessions);
        setTodayWorkouts((prev) =>
          prev.map((session) => (session.id === targetWorkout.id ? { ...session, checkedInAtIso: nowIso } : session))
        );
        setCurrentWorkout((prev) => (prev && prev.id === targetWorkout.id ? { ...prev, checkedInAtIso: nowIso } : prev));
        setProfile({ ...profile, currentStreak: nextStreak, lastCheckInAtIso: nowIso });

        const unlocked = new Set(achievements.map((entry) => entry.code));
        const newOnes = resolveNewAchievements({
          completedSessions: updatedSessions,
          currentStreak: nextStreak,
          unlockedCodes: unlocked,
          t: translate
        });

        if (newOnes.length > 0) {
          for (const item of newOnes) {
            await insertAchievement(item);
          }
          setAchievements((prev) =>
            [...newOnes, ...prev].sort((a, b) => b.unlockedAtIso.localeCompare(a.unlockedAtIso))
          );
        }

        void sendMotivationalNotification(translate);
        scheduleSync();
        return newOnes;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha no check-in";
        await logError("checkin", message);
        setErrors(await getRecentErrors());
        return [];
      }
    },
    [achievements, currentWorkout, profile, scheduleSync, sessions, todayWorkouts]
  );

  const setWorkoutScheduleMode = useCallback(
    async (mode: WorkoutScheduleMode) => {
      await setScheduleMode(mode);
      await refreshAll();
      await syncAfterChange();
    },
    [refreshAll, syncAfterChange]
  );

  const createExerciseLibrary = useCallback(
    async (name: string, imageKey: string) => {
      if (!name.trim()) {
        throw new Error("Informe o nome do exercicio.");
      }
      await createExerciseLibraryItem(name, imageKey || "dumbbell");
      setExerciseLibrary(await getExerciseLibrary());
      await syncAfterChange();
    },
    [syncAfterChange]
  );

  const saveTemplate = useCallback(
    async (params: {
      name: string;
      muscleGroup: string;
      assignedWeekdays: Weekday[];
      orderIndex?: number;
      exercises: Array<{ exerciseName: string; repScheme: string; defaultWeightLabel: string; imageKey: string }>;
    }) => {
      const templateId = await createTemplate(params.name, params.muscleGroup, params.assignedWeekdays, params.orderIndex);
      await clearTemplateExercises(templateId);

      for (const item of params.exercises) {
        if (!item.exerciseName.trim()) {
          continue;
        }
        await addExerciseToTemplateWithWeight(
          templateId,
          item.exerciseName,
          item.repScheme,
          item.defaultWeightLabel,
          item.imageKey || "dumbbell"
        );
      }

      await refreshAll();
      await syncAfterChange();
    },
    [refreshAll, syncAfterChange]
  );

  const moveTemplate = useCallback(
    async (templateId: string, direction: "up" | "down") => {
      await reorderTemplate(templateId, direction);
      await refreshAll();
      await syncAfterChange();
    },
    [refreshAll, syncAfterChange]
  );

  const updateTemplateInfo = useCallback(
    async (templateId: string, name: string, muscleGroup: string, assignedWeekdays: Weekday[]) => {
      await updateTemplate(templateId, name, muscleGroup, assignedWeekdays);
      await refreshAll();
      await syncAfterChange();
    },
    [refreshAll, syncAfterChange]
  );

  const deleteTemplateById = useCallback(
    async (templateId: string) => {
      await deleteTemplate(templateId);
      await refreshAll();
      await syncAfterChange();
    },
    [refreshAll, syncAfterChange]
  );

  const addExerciseToTemplateById = useCallback(
    async (params: {
      templateId: string;
      exerciseName: string;
      repScheme: string;
      defaultWeightLabel: string;
      imageKey: string;
    }) => {
      await addExerciseToTemplateWithWeight(
        params.templateId,
        params.exerciseName,
        params.repScheme,
        params.defaultWeightLabel,
        params.imageKey || "dumbbell"
      );
      await refreshAll();
      await syncAfterChange();
    },
    [refreshAll, syncAfterChange]
  );

  const updateTemplateExerciseById = useCallback(
    async (params: {
      exerciseId: string;
      exerciseName: string;
      repScheme: string;
      defaultWeightLabel: string;
      imageKey: string;
    }) => {
      await updateTemplateExercise(params.exerciseId, {
        exerciseName: params.exerciseName,
        repScheme: params.repScheme,
        defaultWeightLabel: params.defaultWeightLabel,
        imageKey: params.imageKey || "dumbbell"
      });
      await refreshAll();
      await syncAfterChange();
    },
    [refreshAll, syncAfterChange]
  );

  const deleteTemplateExerciseById = useCallback(
    async (exerciseId: string) => {
      await deleteTemplateExercise(exerciseId);
      await refreshAll();
      await syncAfterChange();
    },
    [refreshAll, syncAfterChange]
  );

  const setTemplateActiveById = useCallback(
    async (templateId: string, isActive: boolean) => {
      await setTemplateActive(templateId, isActive);
      await refreshAll();
      await syncAfterChange();
    },
    [refreshAll, syncAfterChange]
  );

  const setTemplateExerciseActiveById = useCallback(
    async (exerciseId: string, isActive: boolean) => {
      await setTemplateExerciseActive(exerciseId, isActive);
      await refreshAll();
      await syncAfterChange();
    },
    [refreshAll, syncAfterChange]
  );

  const fetchTemplateExercises = useCallback(async (templateId: string, includeInactive = false) => {
    return getTemplateExercises(templateId, includeInactive);
  }, []);

  const signUp = useCallback(async (payload: SignUpInput) => {
    await signUpWithEmail(payload);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const user = await signInWithEmail(email.trim(), password);
      setAuthUser(user);
      const cloudProfile = await getUserProfile(user.id);
      if (cloudProfile) {
        await upsertUserProfile(user.id, {
          fullName: cloudProfile.fullName,
          email: cloudProfile.email,
          phone: cloudProfile.phone,
          age: cloudProfile.age,
          heightCm: cloudProfile.heightCm,
          weightKg: cloudProfile.weightKg
        });
        const local = await getProfile();
        await updateProfileDetails(local.id, {
          displayName: cloudProfile.fullName || email.split("@")[0] || "Atleta",
          fullName: cloudProfile.fullName ?? null,
          age: cloudProfile.age ?? null,
          heightCm: cloudProfile.heightCm ?? null,
          weightKg: cloudProfile.weightKg ?? null
        });
      } else {
        await updateProfileDisplayName((await getProfile()).id, email.split("@")[0] || "Atleta");
      }
      const backup = await pullBackup(user.id);
      if (backup) {
        await importBackupPayload(backup);
      }
      await refreshAll();
    },
    [refreshAll]
  );

  const recoverPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(email.trim());
  }, []);

  const signOut = useCallback(async () => {
    await signOutCloud();
    if (syncTimer.current) {
      clearTimeout(syncTimer.current);
      syncTimer.current = null;
    }
    setAuthUser(null);
  }, []);

  const updateProfile = useCallback(
    async (params: {
      displayName?: string;
      fullName?: string | null;
      age?: number | null;
      heightCm?: number | null;
      weightKg?: number | null;
      goal?: FitnessGoal | null;
    }) => {
      const local = await getProfile();
      const normalizedGoal =
        params.goal === undefined ? undefined : params.goal == null ? null : normalizeFitnessGoal(params.goal);
      const payload = { ...params, goal: normalizedGoal };
      await updateProfileDetails(local.id, payload);
      setProfile((current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          displayName: payload.displayName ?? current.displayName,
          fullName: payload.fullName ?? current.fullName,
          age: payload.age ?? current.age,
          heightCm: payload.heightCm ?? current.heightCm,
          weightKg: payload.weightKg ?? current.weightKg,
          goal: payload.goal === undefined ? current.goal : payload.goal
        };
      });
      await refreshAll();
      await syncAfterChange();
    },
    [refreshAll, syncAfterChange]
  );

  const value = useMemo<AppContextData>(
    () => ({
      loading,
      theme,
      language,
      currentWorkout,
      todayWorkouts,
      sessions,
      profile,
      achievements,
      errors,
      templates,
      todayTemplate,
      todayTemplateExercises,
      exerciseLibrary,
      authUser,
      scheduleMode,
      workoutReminderSettings,
      suggestedTemplatesToday,
      bootstrap,
      ensureTodayWorkout,
      createWorkoutFromTemplate,
      saveExercise,
      doCheckIn,
      setTheme,
      setLanguage,
      setWorkoutScheduleMode,
      createExerciseLibrary,
      saveTemplate,
      moveTemplate,
      updateTemplateInfo,
      deleteTemplateById,
      addExerciseToTemplateById,
      updateTemplateExerciseById,
      deleteTemplateExerciseById,
      setTemplateActiveById,
      setTemplateExerciseActiveById,
      fetchTemplateExercises,
      signUp,
      signIn,
      recoverPassword,
      signOut,
      backupNow,
      restoreBackupNow,
      updateWorkoutReminderSettings,
      updateProfile
    }),
    [
      loading,
      theme,
      language,
      currentWorkout,
      todayWorkouts,
      sessions,
      profile,
      achievements,
      errors,
      templates,
      todayTemplate,
      todayTemplateExercises,
      exerciseLibrary,
      authUser,
      scheduleMode,
      workoutReminderSettings,
      suggestedTemplatesToday,
      bootstrap,
      ensureTodayWorkout,
      createWorkoutFromTemplate,
      saveExercise,
      doCheckIn,
      setWorkoutScheduleMode,
      createExerciseLibrary,
      saveTemplate,
      moveTemplate,
      updateTemplateInfo,
      deleteTemplateById,
      addExerciseToTemplateById,
      updateTemplateExerciseById,
      deleteTemplateExerciseById,
      setTemplateActiveById,
      setTemplateExerciseActiveById,
      fetchTemplateExercises,
      signUp,
      signIn,
      recoverPassword,
      signOut,
      backupNow,
      restoreBackupNow,
      updateWorkoutReminderSettings,
      updateProfile
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext precisa estar dentro de AppProvider");
  }
  return context;
}
