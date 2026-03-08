import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { DifficultyLevel, Exercise, ExerciseSetLog, WorkoutWithExercises } from "../types";

type ExerciseDraftState = {
  weightKg: string;
  setLogs: ExerciseSetLog[];
  isCompleted: boolean;
};

const DIFFICULTIES: DifficultyLevel[] = ["easy", "medium", "hard"];

export function WorkoutScreen() {
  const { t } = useI18n();
  const { todayWorkouts, ensureTodayWorkout, createWorkoutFromTemplate, saveExercise, doCheckIn, suggestedTemplatesToday, scheduleMode, templates } =
    useAppContext();
  const isDark = useColorScheme() === "dark";

  const availableTemplates = useMemo(() => {
    const existingIds = new Set(todayWorkouts.map((item) => item.templateId).filter(Boolean));
    const source = scheduleMode === "weekday" ? suggestedTemplatesToday : templates;
    return source.filter((item) => !existingIds.has(item.id));
  }, [scheduleMode, suggestedTemplatesToday, templates, todayWorkouts]);

  return (
    <ScrollView style={{ backgroundColor: isDark ? "#0D1117" : "#F6F8FA" }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("workout.title")}</Text>

      {todayWorkouts.length === 0 ? (
        <Pressable style={styles.primaryButton} onPress={() => void ensureTodayWorkout()}>
          <Text style={styles.primaryButtonText}>{t("workout.create")}</Text>
        </Pressable>
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
            <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "700" }}>{t("workout.dayOverview")}</Text>
            <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>
              {t("workout.totalSessions")}: {todayWorkouts.length}
            </Text>
          </View>

          {todayWorkouts.map((workout, index) => (
            <WorkoutSessionCard key={workout.id} workout={workout} index={index} isDark={isDark} t={t} onSaveExercise={saveExercise} onCheckIn={doCheckIn} />
          ))}
        </>
      )}

      <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
        <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "700" }}>{t("workout.addAnother")}</Text>
        {scheduleMode === "sequence" ? (
          <Pressable style={styles.secondaryButton} onPress={() => void createWorkoutFromTemplate()}>
            <Text style={styles.secondaryButtonText}>{t("workout.addSequenceWorkout")}</Text>
          </Pressable>
        ) : null}
        {availableTemplates.length === 0 ? (
          <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{t("workout.noMoreTemplatesToday")}</Text>
        ) : (
          <View style={styles.templateList}>
            {availableTemplates.map((item) => (
              <Pressable key={item.id} style={styles.templateButton} onPress={() => void createWorkoutFromTemplate(item.id)}>
                <Text style={styles.templateButtonTitle}>{item.name}</Text>
                <Text style={styles.templateButtonSubtitle}>{item.muscleGroup}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function WorkoutSessionCard({
  workout,
  index,
  isDark,
  t,
  onSaveExercise,
  onCheckIn
}: {
  workout: WorkoutWithExercises;
  index: number;
  isDark: boolean;
  t: (key: string) => string;
  onSaveExercise: (params: { exerciseId: string; weightKg: number; setLogs: ExerciseSetLog[]; isCompleted: boolean }) => Promise<void>;
  onCheckIn: (translate: (key: string) => string, sessionId?: string) => Promise<void>;
}) {
  const summary = useMemo(() => {
    const totalVolume = workout.exercises.reduce((acc, item) => acc + item.weightKg * estimateCompletedReps(item.setLogs), 0);
    const completedCount = workout.exercises.filter((item) => item.isCompleted).length;
    return { totalVolume, completedCount };
  }, [workout.exercises]);

  return (
    <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
      <Text style={[styles.sessionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>
        {t("workout.sessionLabel")} {index + 1}
      </Text>
      <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "700" }}>{workout.templateName ?? t("plans.defaultName")}</Text>
      <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{workout.muscleGroup ?? t("plans.defaultMuscle")}</Text>

      {workout.exercises.map((exercise) => (
        <ExerciseExecutionCard key={exercise.id} exercise={exercise} isDark={isDark} t={t} onSaveExercise={onSaveExercise} />
      ))}

      <View style={[styles.summaryCard, { backgroundColor: isDark ? "#0F172A" : "#EFF6FF" }]}>
        <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "600" }}>
          {t("workout.totalVolume")}: {Math.round(summary.totalVolume)} kg
        </Text>
        <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "600" }}>
          {t("workout.completedExercises")}: {summary.completedCount}/{workout.exercises.length}
        </Text>
      </View>

      <Pressable
        style={[styles.primaryButton, Boolean(workout.checkedInAtIso) && styles.primaryButtonDisabled]}
        onPress={() => void onCheckIn(t, workout.id)}
        disabled={Boolean(workout.checkedInAtIso)}
      >
        <Text style={styles.primaryButtonText}>{workout.checkedInAtIso ? t("workout.checkedin") : t("workout.checkin")}</Text>
      </Pressable>
    </View>
  );
}

function ExerciseExecutionCard({
  exercise,
  isDark,
  t,
  onSaveExercise
}: {
  exercise: Exercise;
  isDark: boolean;
  t: (key: string) => string;
  onSaveExercise: (params: { exerciseId: string; weightKg: number; setLogs: ExerciseSetLog[]; isCompleted: boolean }) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ExerciseDraftState>(() => buildDraft(exercise));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(buildDraft(exercise));
  }, [exercise]);

  const completedSets = draft.setLogs.filter((item) => item.actualReps != null).length;

  return (
    <View style={[styles.exerciseCard, { borderColor: isDark ? "#2D3748" : "#E5E7EB" }]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: isDark ? "#1F2937" : "#EEF2F7" }]}>
          <MaterialCommunityIcons name={exercise.imageKey as never} size={18} color={isDark ? "#8AB4F8" : "#1D4ED8"} />
        </View>
        <Text style={[styles.exerciseTitle, { color: isDark ? "#E6EDF3" : "#0F172A" }]}>{exercise.name}</Text>
      </View>

      <Text style={[styles.subtitle, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
        {t("workout.proposedSeries")}: {exercise.repScheme}
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
        {t("workout.plannedWeight")}: {exercise.plannedWeightKg}kg | {t("workout.currentWeight")}: {draft.weightKg || "0"}kg
      </Text>

      <View style={styles.inputRow}>
        <Text style={[styles.fieldLabel, { color: isDark ? "#A7B0BA" : "#4B5563" }]}>{t("workout.currentWeight")} (kg)</Text>
        <TextInput
          style={[styles.input, themedInput(isDark)]}
          keyboardType="numeric"
          value={draft.weightKg}
          onChangeText={(value) => setDraft((prev) => ({ ...prev, weightKg: value }))}
          placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
        />
      </View>

      {draft.setLogs.map((setItem, setIndex) => (
        <View key={`${exercise.id}-${setIndex}`} style={[styles.setCard, { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }]}>
          <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "700" }}>
            {t("workout.set")} {setIndex + 1}
          </Text>
          <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>
            {t("workout.targetReps")}: {setItem.targetReps}
          </Text>
          <TextInput
            style={[styles.input, themedInput(isDark)]}
            keyboardType="numeric"
            value={setItem.actualReps == null ? "" : String(setItem.actualReps)}
            onChangeText={(value) =>
              setDraft((prev) => ({
                ...prev,
                setLogs: prev.setLogs.map((item, itemIndex) =>
                  itemIndex === setIndex ? { ...item, actualReps: value === "" ? null : Math.max(0, Number(value) || 0) } : item
                )
              }))
            }
            placeholder={String(setItem.targetReps)}
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
          />
          <Text style={{ color: isDark ? "#A7B0BA" : "#4B5563", fontWeight: "700" }}>{t("workout.difficulty")}</Text>
          <View style={styles.difficultyRow}>
            {DIFFICULTIES.map((difficulty) => {
              const selected = setItem.difficulty === difficulty;
              return (
                <Pressable
                  key={difficulty}
                  style={[styles.difficultyButton, selected && styles.difficultyButtonActive]}
                  onPress={() =>
                    setDraft((prev) => ({
                      ...prev,
                      setLogs: prev.setLogs.map((item, itemIndex) => (itemIndex === setIndex ? { ...item, difficulty } : item))
                    }))
                  }
                >
                  <Text style={[styles.difficultyText, selected && styles.difficultyTextActive]}>{t(`workout.difficulty.${difficulty}`)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}

      <View style={styles.row}>
        <Pressable
          style={[styles.toggleButton, draft.isCompleted && styles.toggleButtonActive]}
          onPress={() => setDraft((prev) => ({ ...prev, isCompleted: !prev.isCompleted }))}
        >
          <Text style={styles.toggleButtonText}>{draft.isCompleted ? t("workout.doneLabel") : t("workout.markDone")}</Text>
        </Pressable>
        <Pressable
          style={[styles.saveButton, saving && styles.primaryButtonDisabled]}
          disabled={saving}
          onPress={async () => {
            setSaving(true);
            try {
              await onSaveExercise({
                exerciseId: exercise.id,
                weightKg: Math.max(0, Number(draft.weightKg) || 0),
                setLogs: draft.setLogs,
                isCompleted: draft.isCompleted
              });
            } finally {
              setSaving(false);
            }
          }}
        >
          <Text style={styles.primaryButtonText}>{t("workout.saveExercise")}</Text>
        </Pressable>
      </View>
      <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>
        {t("workout.completedSets")}: {completedSets}/{draft.setLogs.length}
      </Text>
    </View>
  );
}

function buildDraft(exercise: Exercise): ExerciseDraftState {
  return {
    weightKg: String(exercise.weightKg),
    setLogs: exercise.setLogs.map((item) => ({ ...item })),
    isCompleted: exercise.isCompleted
  };
}

function themedInput(isDark: boolean) {
  return {
    backgroundColor: isDark ? "#0D1117" : "#FFFFFF",
    borderColor: isDark ? "#2D3748" : "#D1D5DB",
    color: isDark ? "#E6EDF3" : "#111827"
  };
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12
  },
  title: {
    fontSize: 24,
    fontWeight: "700"
  },
  card: {
    padding: 14,
    borderRadius: 16,
    gap: 10
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: "700"
  },
  exerciseCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  subtitle: {
    color: "#444"
  },
  exerciseTitle: {
    fontWeight: "600",
    fontSize: 16,
    flex: 1
  },
  inputRow: {
    gap: 4
  },
  fieldLabel: {
    fontSize: 13,
    color: "#333"
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  setCard: {
    borderRadius: 12,
    padding: 10,
    gap: 6
  },
  difficultyRow: {
    flexDirection: "row",
    gap: 8
  },
  difficultyButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    paddingVertical: 8,
    alignItems: "center"
  },
  difficultyButtonActive: {
    backgroundColor: "#2563EB"
  },
  difficultyText: {
    color: "#334155",
    fontWeight: "700"
  },
  difficultyTextActive: {
    color: "#FFFFFF"
  },
  toggleButton: {
    flex: 1,
    backgroundColor: "#64748B",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  toggleButtonActive: {
    backgroundColor: "#16A34A"
  },
  toggleButtonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  summaryCard: {
    borderRadius: 12,
    padding: 12,
    gap: 4
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center"
  },
  primaryButtonDisabled: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  secondaryButton: {
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  secondaryButtonText: {
    color: "#1D4ED8",
    fontWeight: "700"
  },
  templateList: {
    gap: 8
  },
  templateButton: {
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    padding: 12
  },
  templateButtonTitle: {
    color: "#111827",
    fontWeight: "700"
  },
  templateButtonSubtitle: {
    color: "#4B5563"
  }
});

function estimateCompletedReps(setLogs: ExerciseSetLog[]) {
  return setLogs.reduce((acc, item) => acc + (item.actualReps ?? item.targetReps), 0);
}
