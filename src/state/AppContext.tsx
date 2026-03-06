import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import { resolveNewAchievements } from "../core/gamification";
import { calculateUpdatedStreak } from "../core/streak";
import {
  addExerciseToTemplateWithWeight,
  checkInTodayWorkout,
  clearTemplateExercises,
  createExerciseLibraryItem,
  createTemplate,
  createTodayWorkoutIfMissing,
  deleteTemplate,
  deleteTemplateExercise,
  exportBackupPayload,
  getAchievements,
  getAllSessions,
  getExerciseLibrary,
  getProfile,
  getRecentErrors,
  getTemplateExercises,
  getTemplates,
  getTodayTemplate,
  getTodayWorkout,
  importBackupPayload,
  insertAchievement,
  logError,
  reorderTemplate,
  updateTemplate,
  updateTemplateExercise,
  updateExerciseMetrics,
  updateProfileDisplayName,
  updateProfileStreak
} from "../db/database";
import { sendMotivationalNotification } from "../services/notifications";
import {
  getCurrentAuthUser,
  getUserProfile,
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
  TemplateExercise,
  UserProfile,
  SignUpInput,
  WorkoutTemplate,
  WorkoutWithExercises
} from "../types";

type AppContextData = {
  loading: boolean;
  theme: AppTheme;
  language: AppLanguage;
  currentWorkout: WorkoutWithExercises | null;
  sessions: WorkoutWithExercises[];
  profile: UserProfile | null;
  achievements: Achievement[];
  errors: { id: string; category: string; message: string; createdAtIso: string }[];
  templates: WorkoutTemplate[];
  todayTemplate: WorkoutTemplate | null;
  todayTemplateExercises: TemplateExercise[];
  exerciseLibrary: ExerciseLibraryItem[];
  authUser: AuthUser | null;
  bootstrap: () => Promise<void>;
  ensureTodayWorkout: () => Promise<void>;
  saveExercise: (exerciseId: string, weightKg: number, intensity: number, isCompleted: boolean) => Promise<void>;
  doCheckIn: (translate: (key: string) => string) => Promise<void>;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: AppLanguage) => void;
  createExerciseLibrary: (name: string, imageKey: string) => Promise<void>;
  saveTemplate: (params: {
    name: string;
    muscleGroup: string;
    exercises: Array<{ exerciseName: string; repScheme: string; defaultWeightKg: number; imageKey: string }>;
  }) => Promise<void>;
  moveTemplate: (templateId: string, direction: "up" | "down") => Promise<void>;
  updateTemplateInfo: (templateId: string, name: string, muscleGroup: string) => Promise<void>;
  deleteTemplateById: (templateId: string) => Promise<void>;
  addExerciseToTemplateById: (params: {
    templateId: string;
    exerciseName: string;
    repScheme: string;
    defaultWeightKg: number;
    imageKey: string;
  }) => Promise<void>;
  updateTemplateExerciseById: (params: {
    exerciseId: string;
    exerciseName: string;
    repScheme: string;
    defaultWeightKg: number;
    imageKey: string;
  }) => Promise<void>;
  deleteTemplateExerciseById: (exerciseId: string) => Promise<void>;
  fetchTemplateExercises: (templateId: string) => Promise<TemplateExercise[]>;
  signUp: (payload: SignUpInput) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  backupNow: () => Promise<void>;
  restoreBackupNow: () => Promise<void>;
};

const AppContext = createContext<AppContextData | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const deviceTheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<AppTheme>(deviceTheme === "dark" ? "dark" : "light");
  const [language, setLanguage] = useState<AppLanguage>("pt-BR");
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutWithExercises | null>(null);
  const [sessions, setSessions] = useState<WorkoutWithExercises[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [errors, setErrors] = useState<{ id: string; category: string; message: string; createdAtIso: string }[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [todayTemplate, setTodayTemplate] = useState<WorkoutTemplate | null>(null);
  const [todayTemplateExercises, setTodayTemplateExercises] = useState<TemplateExercise[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibraryItem[]>([]);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const refreshAll = useCallback(async () => {
    const [today, allSessions, userProfile, unlockedAchievements, recentErrors, templatesList, todayTemplateData, library, sessionUser] =
      await Promise.all([
        getTodayWorkout(),
        getAllSessions(),
        getProfile(),
        getAchievements(),
        getRecentErrors(),
        getTemplates(),
        getTodayTemplate(),
        getExerciseLibrary(),
        getCurrentAuthUser()
      ]);

    setCurrentWorkout(today);
    setSessions(allSessions);
    setProfile(userProfile);
    setAchievements(unlockedAchievements);
    setErrors(recentErrors);
    setTemplates(templatesList);
    setTodayTemplate(todayTemplateData.template);
    setTodayTemplateExercises(todayTemplateData.exercises);
    setExerciseLibrary(library);
    setAuthUser(sessionUser);
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

  const syncAfterChange = useCallback(async () => {
    if (!authUser) {
      return;
    }
    const payload = await exportBackupPayload();
    await pushBackup(authUser.id, payload);
  }, [authUser]);

  const ensureTodayWorkout = useCallback(async () => {
    try {
      const workout = await createTodayWorkoutIfMissing();
      setCurrentWorkout(workout);
      const [allSessions, todayData] = await Promise.all([getAllSessions(), getTodayTemplate()]);
      setSessions(allSessions);
      setTodayTemplate(todayData.template);
      setTodayTemplateExercises(todayData.exercises);
      await syncAfterChange();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar treino";
      await logError("ensure-workout", message);
      setErrors(await getRecentErrors());
    }
  }, [syncAfterChange]);

  const saveExercise = useCallback(
    async (exerciseId: string, weightKg: number, intensity: number, isCompleted: boolean) => {
      try {
        await updateExerciseMetrics(exerciseId, weightKg, intensity, isCompleted);
        const today = await getTodayWorkout();
        setCurrentWorkout(today);
        const allSessions = await getAllSessions();
        setSessions(allSessions);
        await syncAfterChange();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao salvar exercicio";
        await logError("save-exercise", message);
        setErrors(await getRecentErrors());
      }
    },
    [syncAfterChange]
  );

  const doCheckIn = useCallback(
    async (translate: (key: string) => string) => {
      if (!currentWorkout || !profile) {
        return;
      }
      if (currentWorkout.checkedInAtIso) {
        return;
      }

      try {
        await checkInTodayWorkout(currentWorkout.id);
        const delta = calculateUpdatedStreak(profile.lastCheckInAtIso, new Date());
        const nextStreak = delta === -1 ? 1 : profile.currentStreak + delta;
        await updateProfileStreak(profile.id, nextStreak, new Date().toISOString());

        const allSessions = await getAllSessions();
        const updatedAchievements = await getAchievements();
        const unlocked = new Set(updatedAchievements.map((entry) => entry.code));
        const newOnes = resolveNewAchievements({
          completedSessions: allSessions,
          currentStreak: nextStreak,
          unlockedCodes: unlocked,
          t: translate
        });

        for (const item of newOnes) {
          await insertAchievement(item);
        }

        await sendMotivationalNotification(translate);
        await refreshAll();
        await syncAfterChange();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha no check-in";
        await logError("checkin", message);
        setErrors(await getRecentErrors());
      }
    },
    [currentWorkout, profile, refreshAll, syncAfterChange]
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
      exercises: Array<{ exerciseName: string; repScheme: string; defaultWeightKg: number; imageKey: string }>;
    }) => {
      const templateId = await createTemplate(params.name, params.muscleGroup);
      await clearTemplateExercises(templateId);

      for (const item of params.exercises) {
        if (!item.exerciseName.trim()) {
          continue;
        }
        await addExerciseToTemplateWithWeight(
          templateId,
          item.exerciseName,
          item.repScheme,
          item.defaultWeightKg,
          item.imageKey || "dumbbell"
        );
      }

      const [templatesList, todayData] = await Promise.all([getTemplates(), getTodayTemplate()]);
      setTemplates(templatesList);
      setTodayTemplate(todayData.template);
      setTodayTemplateExercises(todayData.exercises);
      await syncAfterChange();
    },
    [syncAfterChange]
  );

  const moveTemplate = useCallback(
    async (templateId: string, direction: "up" | "down") => {
      await reorderTemplate(templateId, direction);
      const [templatesList, todayData] = await Promise.all([getTemplates(), getTodayTemplate()]);
      setTemplates(templatesList);
      setTodayTemplate(todayData.template);
      setTodayTemplateExercises(todayData.exercises);
      await syncAfterChange();
    },
    [syncAfterChange]
  );

  const updateTemplateInfo = useCallback(
    async (templateId: string, name: string, muscleGroup: string) => {
      await updateTemplate(templateId, name, muscleGroup);
      const [templatesList, todayData] = await Promise.all([getTemplates(), getTodayTemplate()]);
      setTemplates(templatesList);
      setTodayTemplate(todayData.template);
      setTodayTemplateExercises(todayData.exercises);
      await syncAfterChange();
    },
    [syncAfterChange]
  );

  const deleteTemplateById = useCallback(
    async (templateId: string) => {
      await deleteTemplate(templateId);
      const [templatesList, todayData] = await Promise.all([getTemplates(), getTodayTemplate()]);
      setTemplates(templatesList);
      setTodayTemplate(todayData.template);
      setTodayTemplateExercises(todayData.exercises);
      await syncAfterChange();
    },
    [syncAfterChange]
  );

  const addExerciseToTemplateById = useCallback(
    async (params: {
      templateId: string;
      exerciseName: string;
      repScheme: string;
      defaultWeightKg: number;
      imageKey: string;
    }) => {
      await addExerciseToTemplateWithWeight(
        params.templateId,
        params.exerciseName,
        params.repScheme,
        params.defaultWeightKg,
        params.imageKey || "dumbbell"
      );
      const todayData = await getTodayTemplate();
      setTodayTemplate(todayData.template);
      setTodayTemplateExercises(todayData.exercises);
      await syncAfterChange();
    },
    [syncAfterChange]
  );

  const updateTemplateExerciseById = useCallback(
    async (params: {
      exerciseId: string;
      exerciseName: string;
      repScheme: string;
      defaultWeightKg: number;
      imageKey: string;
    }) => {
      await updateTemplateExercise(params.exerciseId, {
        exerciseName: params.exerciseName,
        repScheme: params.repScheme,
        defaultWeightKg: params.defaultWeightKg,
        imageKey: params.imageKey || "dumbbell"
      });
      const todayData = await getTodayTemplate();
      setTodayTemplate(todayData.template);
      setTodayTemplateExercises(todayData.exercises);
      await syncAfterChange();
    },
    [syncAfterChange]
  );

  const deleteTemplateExerciseById = useCallback(
    async (exerciseId: string) => {
      await deleteTemplateExercise(exerciseId);
      const todayData = await getTodayTemplate();
      setTodayTemplate(todayData.template);
      setTodayTemplateExercises(todayData.exercises);
      await syncAfterChange();
    },
    [syncAfterChange]
  );

  const fetchTemplateExercises = useCallback(async (templateId: string) => {
    return getTemplateExercises(templateId);
  }, []);

  const signUp = useCallback(async (payload: SignUpInput) => {
    await signUpWithEmail(payload);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
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
      await updateProfileDisplayName((await getProfile()).id, cloudProfile.fullName || email.split("@")[0] || "Atleta");
    } else {
      await updateProfileDisplayName((await getProfile()).id, email.split("@")[0] || "Atleta");
    }
    const backup = await pullBackup(user.id);
    if (backup) {
      await importBackupPayload(backup);
    }
    await refreshAll();
  }, [refreshAll]);

  const signOut = useCallback(async () => {
    await signOutCloud();
    setAuthUser(null);
  }, []);

  const value = useMemo<AppContextData>(
    () => ({
      loading,
      theme,
      language,
      currentWorkout,
      sessions,
      profile,
      achievements,
      errors,
      templates,
      todayTemplate,
      todayTemplateExercises,
      exerciseLibrary,
      authUser,
      bootstrap,
      ensureTodayWorkout,
      saveExercise,
      doCheckIn,
      setTheme,
      setLanguage,
      createExerciseLibrary,
      saveTemplate,
      moveTemplate,
      updateTemplateInfo,
      deleteTemplateById,
      addExerciseToTemplateById,
      updateTemplateExerciseById,
      deleteTemplateExerciseById,
      fetchTemplateExercises,
      signUp,
      signIn,
      signOut,
      backupNow,
      restoreBackupNow
    }),
    [
      loading,
      theme,
      language,
      currentWorkout,
      sessions,
      profile,
      achievements,
      errors,
      templates,
      todayTemplate,
      todayTemplateExercises,
      exerciseLibrary,
      authUser,
      bootstrap,
      ensureTodayWorkout,
      saveExercise,
      doCheckIn,
      createExerciseLibrary,
      saveTemplate,
      moveTemplate,
      updateTemplateInfo,
      deleteTemplateById,
      addExerciseToTemplateById,
      updateTemplateExerciseById,
      deleteTemplateExerciseById,
      fetchTemplateExercises,
      signUp,
      signIn,
      signOut,
      backupNow,
      restoreBackupNow
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
