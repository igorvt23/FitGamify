export type AppTheme = "light" | "dark" | "system";
export type AppLanguage = "pt-BR" | "en";

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weightKg: number;
  intensity: number;
  imageKey: string;
};

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  imageKey: string;
  createdAtIso: string;
};

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type WorkoutTemplate = {
  id: string;
  name: string;
  muscleGroup: string;
  weekday: Weekday;
  createdAtIso: string;
};

export type TemplateExercise = {
  id: string;
  templateId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  imageKey: string;
};

export type WorkoutSession = {
  id: string;
  dateIso: string;
  checkedInAtIso: string | null;
  notes: string | null;
};

export type AchievementCode = "first_checkin" | "streak_3" | "streak_7" | "workout_10";

export type Achievement = {
  id: string;
  code: AchievementCode;
  title: string;
  detail: string;
  unlockedAtIso: string;
};

export type UserProfile = {
  id: string;
  displayName: string;
  currentStreak: number;
  lastCheckInAtIso: string | null;
};

export type WorkoutWithExercises = WorkoutSession & { exercises: Exercise[] };

export type AuthUser = {
  id: string;
  email: string;
};

export type SignUpInput = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  age: number;
  heightCm: number;
  weightKg: number;
};

export type CloudUserProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  heightCm: number;
  weightKg: number;
  updatedAtIso: string;
};

export type CloudBackupPayload = {
  workouts: WorkoutWithExercises[];
  achievements: Achievement[];
  profile: UserProfile | null;
  templates: WorkoutTemplate[];
  templateExercises: TemplateExercise[];
  exerciseLibrary: ExerciseLibraryItem[];
};
