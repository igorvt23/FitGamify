export type AppTheme = "light" | "dark" | "system";
export type AppLanguage = "pt-BR" | "en" | "es";

export type DifficultyLevel = "easy" | "medium" | "hard";

export type ExerciseSetLog = {
  targetReps: number;
  actualReps: number | null;
  difficulty: DifficultyLevel | null;
};

export type Exercise = {
  id: string;
  name: string;
  repScheme: string;
  plannedWeightKg: number;
  weightKg: number;
  intensity: number;
  anxietyLevel: number | null;
  isCompleted: boolean;
  imageKey: string;
  setLogs: ExerciseSetLog[];
};

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  imageKey: string;
  createdAtIso: string;
};

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type WorkoutScheduleMode = "sequence" | "weekday";

export type WorkoutReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  weekdays: Weekday[];
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  muscleGroup: string;
  orderIndex: number;
  assignedWeekdays: Weekday[];
  createdAtIso: string;
  isActive: boolean;
};

export type TemplateExercise = {
  id: string;
  templateId: string;
  exerciseName: string;
  repScheme: string;
  defaultWeightKg: number;
  imageKey: string;
  isActive: boolean;
};

export type WorkoutSession = {
  id: string;
  dateIso: string;
  sessionIndex: number;
  checkedInAtIso: string | null;
  templateId: string | null;
  templateName: string | null;
  muscleGroup: string | null;
  notes: string | null;
};

export type AchievementCode =
  | "first_checkin"
  | "streak_3"
  | "streak_7"
  | "streak_14"
  | "streak_30"
  | "workout_10"
  | "workout_25"
  | "workout_50";

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
  fullName: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: FitnessGoal | null;
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
  scheduleMode: WorkoutScheduleMode;
  workoutReminderSettings?: WorkoutReminderSettings;
  templates: WorkoutTemplate[];
  templateExercises: TemplateExercise[];
  exerciseLibrary: ExerciseLibraryItem[];
};
export type FitnessGoal = "lose" | "gain" | "maintain";
