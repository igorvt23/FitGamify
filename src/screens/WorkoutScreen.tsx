import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { DifficultyLevel, Exercise, ExerciseSetLog, WorkoutWithExercises } from "../types";

type ExerciseDraftState = {
  weightKg: string;
  anxietyLevel: string;
  setLogs: ExerciseSetLog[];
  isCompleted: boolean;
};

const DIFFICULTIES: DifficultyLevel[] = ["easy", "medium", "hard"];

export function WorkoutScreen() {
  const { t } = useI18n();
  const { todayWorkouts, ensureTodayWorkout, createWorkoutFromTemplate, saveExercise, doCheckIn, suggestedTemplatesToday, scheduleMode, templates } =
    useAppContext();
  const isDark = useColorScheme() === "dark";
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    if (todayWorkouts.length === 0) {
      setSelectedWorkoutId(null);
      return;
    }
    setSelectedWorkoutId((current) => (current && todayWorkouts.some((item) => item.id === current) ? current : todayWorkouts[0].id));
  }, [todayWorkouts]);

  const selectedWorkout = useMemo(
    () => todayWorkouts.find((item) => item.id === selectedWorkoutId) ?? todayWorkouts[0] ?? null,
    [selectedWorkoutId, todayWorkouts]
  );

  const availableTemplates = useMemo(() => {
    const existingIds = new Set(todayWorkouts.map((item) => item.templateId).filter(Boolean));
    const source = scheduleMode === "weekday" ? suggestedTemplatesToday : templates;
    return source.filter((item) => !existingIds.has(item.id));
  }, [scheduleMode, suggestedTemplatesToday, templates, todayWorkouts]);

  return (
    <ScrollView style={{ backgroundColor: isDark ? "#0D1117" : "#F6F8FA" }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("workout.title")}</Text>

      {todayWorkouts.length === 0 ? (
        <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("workout.createdWorkouts")}</Text>
          <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{t("workout.selectWorkout")}</Text>
          <Pressable style={styles.primaryButton} onPress={() => void ensureTodayWorkout()}>
            <Text style={styles.primaryButtonText}>{t("workout.create")}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("workout.todayOrder")}</Text>
            <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>
              {t("workout.totalSessions")}: {todayWorkouts.length}
            </Text>
            <View style={styles.workoutList}>
              {todayWorkouts.map((workout, index) => {
                const selected = workout.id === selectedWorkout?.id;
                return (
                  <Pressable
                    key={workout.id}
                    style={[
                      styles.workoutChip,
                      { backgroundColor: selected ? "#2563EB" : isDark ? "#0F172A" : "#E5E7EB" }
                    ]}
                    onPress={() => setSelectedWorkoutId(workout.id)}
                  >
                    <Text style={[styles.workoutChipOrder, { color: selected ? "#BFDBFE" : isDark ? "#93C5FD" : "#1D4ED8" }]}>
                      #{index + 1}
                    </Text>
                    <Text style={[styles.workoutChipTitle, { color: selected ? "#FFFFFF" : isDark ? "#E6EDF3" : "#111827" }]}>
                      {workout.templateName ?? t("plans.defaultName")}
                    </Text>
                    <Text style={{ color: selected ? "#DBEAFE" : isDark ? "#9CA3AF" : "#6B7280" }}>
                      {workout.muscleGroup ?? t("plans.defaultMuscle")}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {selectedWorkout ? (
            <WorkoutSessionCard workout={selectedWorkout} isDark={isDark} t={t} onSaveExercise={saveExercise} onCheckIn={doCheckIn} />
          ) : null}
        </>
      )}

      <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("workout.addTodayWorkout")}</Text>
        {scheduleMode === "sequence" && availableTemplates.length > 0 ? (
          <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{t("workout.nextRecommended")}</Text>
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
  isDark,
  t,
  onSaveExercise,
  onCheckIn
}: {
  workout: WorkoutWithExercises;
  isDark: boolean;
  t: (key: string) => string;
  onSaveExercise: (params: { exerciseId: string; weightKg: number; setLogs: ExerciseSetLog[]; anxietyLevel: number | null; isCompleted: boolean }) => Promise<void>;
  onCheckIn: (translate: (key: string) => string, sessionId?: string) => Promise<void>;
}) {
  const summary = useMemo(() => {
    const totalVolume = workout.exercises.reduce((acc, item) => acc + item.weightKg * estimateCompletedReps(item.setLogs), 0);
    const completedCount = workout.exercises.filter((item) => item.isCompleted).length;
    return { totalVolume, completedCount };
  }, [workout.exercises]);

  return (
    <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
      <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("workout.selectedWorkout")}</Text>
      <Text style={[styles.sessionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{workout.templateName ?? t("plans.defaultName")}</Text>
      <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{workout.muscleGroup ?? t("plans.defaultMuscle")}</Text>

      <View style={[styles.summaryCard, { backgroundColor: isDark ? "#0F172A" : "#EFF6FF" }]}>
        <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "600" }}>
          {t("workout.completedExercises")}: {summary.completedCount}/{workout.exercises.length}
        </Text>
        <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "600" }}>
          {t("workout.totalVolume")}: {Math.round(summary.totalVolume)} kg
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("workout.exercisesTitle")}</Text>
      {workout.exercises.length === 0 ? (
        <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{t("workout.noExercisesInWorkout")}</Text>
      ) : (
        workout.exercises.map((exercise, index) => (
          <ExerciseExecutionCard key={exercise.id} exercise={exercise} order={index + 1} isDark={isDark} t={t} onSaveExercise={onSaveExercise} />
        ))
      )}

      <Pressable
        style={[styles.primaryButton, Boolean(workout.checkedInAtIso) && styles.primaryButtonDisabled]}
        onPress={() => void onCheckIn(t, workout.id)}
        disabled={Boolean(workout.checkedInAtIso)}
      >
        <Text style={styles.primaryButtonText}>{workout.checkedInAtIso ? t("workout.checkedin") : t("workout.finishWorkout")}</Text>
      </Pressable>
    </View>
  );
}

function ExerciseExecutionCard({
  exercise,
  order,
  isDark,
  t,
  onSaveExercise
}: {
  exercise: Exercise;
  order: number;
  isDark: boolean;
  t: (key: string) => string;
  onSaveExercise: (params: { exerciseId: string; weightKg: number; setLogs: ExerciseSetLog[]; anxietyLevel: number | null; isCompleted: boolean }) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ExerciseDraftState>(() => buildDraft(exercise));
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setDraft(buildDraft(exercise));
  }, [exercise]);

  const completedSets = draft.setLogs.filter((item) => item.actualReps != null).length;

  const persist = async (payload: { completeExercise: boolean }) => {
    setSaving(true);
    try {
      await onSaveExercise({
        exerciseId: exercise.id,
        weightKg: Math.max(0, Number(draft.weightKg) || 0),
        setLogs: draft.setLogs,
        anxietyLevel: draft.anxietyLevel === "" ? null : Math.max(0, Math.min(10, Number(draft.anxietyLevel) || 0)),
        isCompleted: payload.completeExercise ? true : draft.isCompleted
      });
      if (payload.completeExercise) {
        setDraft((prev) => ({ ...prev, isCompleted: true }));
        setModalOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.exerciseCard, { borderColor: isDark ? "#2D3748" : "#E5E7EB" }]}>
      <View style={styles.rowBetween}>
        <View style={styles.row}>
          <View style={[styles.iconWrap, { backgroundColor: isDark ? "#1F2937" : "#EEF2F7" }]}>
            <MaterialCommunityIcons name={exercise.imageKey as never} size={18} color={isDark ? "#8AB4F8" : "#1D4ED8"} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.exerciseTitle, { color: isDark ? "#E6EDF3" : "#0F172A" }]}>
              {order}. {exercise.name}
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
              {t("workout.proposedSeries")}: {exercise.repScheme}
            </Text>
          </View>
        </View>
        <Text style={{ color: draft.isCompleted ? "#16A34A" : isDark ? "#9CA3AF" : "#6B7280", fontWeight: "700" }}>
          {draft.isCompleted ? t("workout.doneLabel") : `${completedSets}/${draft.setLogs.length}`}
        </Text>
      </View>

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
          <Text style={{ color: isDark ? "#A7B0BA" : "#4B5563", fontWeight: "700" }}>{t("workout.difficultyLabel")}</Text>
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

      <View style={styles.actionRow}>
        <Pressable style={[styles.saveButton, saving && styles.primaryButtonDisabled]} disabled={saving} onPress={() => void persist({ completeExercise: false })}>
          <Text style={styles.primaryButtonText}>{t("workout.saveExercise")}</Text>
        </Pressable>
        <Pressable
          style={[styles.completeButton, (saving || draft.isCompleted) && styles.primaryButtonDisabled]}
          disabled={saving || draft.isCompleted}
          onPress={() => setModalOpen(true)}
        >
          <Text style={styles.primaryButtonText}>{t("workout.completeExercise")}</Text>
        </Pressable>
      </View>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("workout.completeModalTitle")}</Text>
            <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{t("workout.completeModalHint")}</Text>

            <Text style={[styles.fieldLabel, { color: isDark ? "#A7B0BA" : "#4B5563" }]}>{t("workout.currentWeight")} (kg)</Text>
            <TextInput
              style={[styles.input, themedInput(isDark)]}
              keyboardType="numeric"
              value={draft.weightKg}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, weightKg: value }))}
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            />

            <Text style={[styles.fieldLabel, { color: isDark ? "#A7B0BA" : "#4B5563" }]}>{t("workout.anxietyLevel")} (0-10)</Text>
            <TextInput
              style={[styles.input, themedInput(isDark)]}
              keyboardType="numeric"
              value={draft.anxietyLevel}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, anxietyLevel: value }))}
              placeholder="0"
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            />

            <View style={styles.actionRow}>
              <Pressable style={styles.secondaryButton} onPress={() => setModalOpen(false)}>
                <Text style={styles.secondaryButtonText}>{t("workout.cancel")}</Text>
              </Pressable>
              <Pressable style={[styles.completeButton, saving && styles.primaryButtonDisabled]} disabled={saving} onPress={() => void persist({ completeExercise: true })}>
                <Text style={styles.primaryButtonText}>{t("workout.confirm")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function buildDraft(exercise: Exercise): ExerciseDraftState {
  return {
    weightKg: String(exercise.weightKg),
    anxietyLevel: exercise.anxietyLevel == null ? "" : String(exercise.anxietyLevel),
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700"
  },
  sessionTitle: {
    fontSize: 20,
    fontWeight: "700"
  },
  workoutList: {
    gap: 8
  },
  workoutChip: {
    borderRadius: 14,
    padding: 12,
    gap: 4
  },
  workoutChipOrder: {
    fontSize: 12,
    fontWeight: "700"
  },
  workoutChipTitle: {
    fontWeight: "700",
    fontSize: 16
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
  rowBetween: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
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
  actionRow: {
    flexDirection: "row",
    gap: 8
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  completeButton: {
    flex: 1,
    backgroundColor: "#16A34A",
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
    flex: 1,
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
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    padding: 20,
    justifyContent: "center"
  },
  modalCard: {
    borderRadius: 16,
    padding: 16,
    gap: 10
  }
});

function estimateCompletedReps(setLogs: ExerciseSetLog[]) {
  return setLogs.reduce((acc, item) => acc + (item.actualReps ?? item.targetReps), 0);
}
