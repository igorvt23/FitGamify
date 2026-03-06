import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";

export function WorkoutScreen() {
  const { t } = useI18n();
  const { currentWorkout, ensureTodayWorkout, saveExercise, doCheckIn, todayTemplate } = useAppContext();
  const isDark = useColorScheme() === "dark";

  const summary = useMemo(() => {
    if (!currentWorkout) {
      return { totalVolume: 0, avgIntensity: 0 };
    }
    const totalVolume = currentWorkout.exercises.reduce((acc, item) => {
      return acc + item.weightKg * estimateTotalReps(item.repScheme);
    }, 0);
    const avgIntensity =
      currentWorkout.exercises.length === 0
        ? 0
        : currentWorkout.exercises.reduce((acc, item) => acc + item.intensity, 0) / currentWorkout.exercises.length;
    const completedCount = currentWorkout.exercises.filter((item) => item.isCompleted).length;
    return { totalVolume, avgIntensity, completedCount };
  }, [currentWorkout]);

  return (
    <ScrollView style={{ backgroundColor: isDark ? "#0D1117" : "#F6F8FA" }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("workout.title")}</Text>
      {todayTemplate ? (
        <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
          <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "700" }}>
            {t("workout.todayPlan")}: {todayTemplate.name}
          </Text>
          <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>
            {t("workout.muscleGroup")}: {todayTemplate.muscleGroup}
          </Text>
        </View>
      ) : null}

      {!currentWorkout ? (
        <Pressable style={styles.primaryButton} onPress={() => void ensureTodayWorkout()}>
          <Text style={styles.primaryButtonText}>{t("workout.create")}</Text>
        </Pressable>
      ) : (
        <>
          {currentWorkout.exercises.map((item) => (
            <View key={item.id} style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
              <View style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: isDark ? "#1F2937" : "#EEF2F7" }]}>
                  <MaterialCommunityIcons name={item.imageKey as never} size={18} color={isDark ? "#8AB4F8" : "#1D4ED8"} />
                </View>
                <Text style={[styles.exerciseTitle, { color: isDark ? "#E6EDF3" : "#0F172A" }]}>{item.name}</Text>
                <Pressable
                  style={[styles.checkButton, item.isCompleted && styles.checkButtonActive]}
                  onPress={() => void saveExercise(item.id, item.weightKg, item.intensity, !item.isCompleted)}
                >
                  <MaterialCommunityIcons name={item.isCompleted ? "check-bold" : "check"} size={14} color="#FFFFFF" />
                </Pressable>
              </View>
              <Text style={[styles.subtitle, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
                {item.repScheme}
              </Text>
              <View style={styles.inputRow}>
                <Text style={[styles.fieldLabel, { color: isDark ? "#A7B0BA" : "#4B5563" }]}>{t("workout.weight")} (kg)</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? "#0D1117" : "#FFFFFF",
                      borderColor: isDark ? "#2D3748" : "#D1D5DB",
                      color: isDark ? "#E6EDF3" : "#111827"
                    }
                  ]}
                  keyboardType="numeric"
                  defaultValue={String(item.weightKg)}
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                  onEndEditing={(event) => {
                    const weight = Number(event.nativeEvent.text || 0);
                    void saveExercise(item.id, Number.isNaN(weight) ? 0 : weight, item.intensity, item.isCompleted);
                  }}
                />
              </View>
              <View style={styles.inputRow}>
                <Text style={[styles.fieldLabel, { color: isDark ? "#A7B0BA" : "#4B5563" }]}>{t("workout.intensity")} (1-10)</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? "#0D1117" : "#FFFFFF",
                      borderColor: isDark ? "#2D3748" : "#D1D5DB",
                      color: isDark ? "#E6EDF3" : "#111827"
                    }
                  ]}
                  keyboardType="numeric"
                  defaultValue={String(item.intensity)}
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                  onEndEditing={(event) => {
                    const intensity = Number(event.nativeEvent.text || 5);
                    const clamped = Math.max(1, Math.min(10, Number.isNaN(intensity) ? 5 : intensity));
                    void saveExercise(item.id, item.weightKg, clamped, item.isCompleted);
                  }}
                />
              </View>
            </View>
          ))}

          <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
            <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "600" }}>
              {t("workout.totalVolume")}: {Math.round(summary.totalVolume)} kg
            </Text>
            <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "600" }}>
              {t("workout.intensityAvg")}: {summary.avgIntensity.toFixed(1)}
            </Text>
            <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "600" }}>
              {t("workout.completedExercises")}: {summary.completedCount}/{currentWorkout.exercises.length}
            </Text>
          </View>

          <Pressable
            style={[styles.primaryButton, Boolean(currentWorkout.checkedInAtIso) && styles.primaryButtonDisabled]}
            onPress={() => void doCheckIn(t)}
            disabled={Boolean(currentWorkout.checkedInAtIso)}
          >
            <Text style={styles.primaryButtonText}>
              {currentWorkout.checkedInAtIso ? t("workout.checkedin") : t("workout.checkin")}
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
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
  checkButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#64748B",
    alignItems: "center",
    justifyContent: "center"
  },
  checkButtonActive: {
    backgroundColor: "#16A34A"
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
  }
});

function estimateTotalReps(repScheme: string) {
  const chunks = repScheme.split(",");
  let total = 0;

  for (const raw of chunks) {
    const item = raw.trim().toLowerCase();
    const [setsRaw, repsRaw] = item.split("x");
    const sets = Number(setsRaw);
    const reps = Number(repsRaw);
    if (Number.isNaN(sets) || Number.isNaN(reps)) {
      continue;
    }
    total += sets * reps;
  }

  return total > 0 ? total : 40;
}
