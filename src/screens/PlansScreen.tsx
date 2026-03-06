import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";

import { useAppContext } from "../state/AppContext";
import { Weekday } from "../types";
import { useI18n } from "../i18n";

const weekDays: Array<{ value: Weekday; key: string }> = [
  { value: 0, key: "plans.weekday.sunday" },
  { value: 1, key: "plans.weekday.monday" },
  { value: 2, key: "plans.weekday.tuesday" },
  { value: 3, key: "plans.weekday.wednesday" },
  { value: 4, key: "plans.weekday.thursday" },
  { value: 5, key: "plans.weekday.friday" },
  { value: 6, key: "plans.weekday.saturday" }
];

export function PlansScreen() {
  const { t } = useI18n();
  const isDark = useColorScheme() === "dark";
  const { templates, exerciseLibrary, createExerciseLibrary, saveTemplateForDay } = useAppContext();

  const [templateName, setTemplateName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [weekday, setWeekday] = useState<Weekday>(1);
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("4");
  const [reps, setReps] = useState("10");
  const [draftExercises, setDraftExercises] = useState<Array<{ exerciseName: string; sets: number; reps: number; imageKey: string }>>([]);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [saving, setSaving] = useState(false);

  const weekdayLabel = useMemo(() => t(weekDays.find((item) => item.value === weekday)?.key ?? "plans.weekday.monday"), [t, weekday]);

  const addDraftExercise = () => {
    if (!exerciseName.trim()) {
      return;
    }
    setDraftExercises((prev) => [
      ...prev,
      {
        exerciseName: exerciseName.trim(),
        sets: Number(sets || "4"),
        reps: Number(reps || "10"),
        imageKey: "dumbbell"
      }
    ]);
    setExerciseName("");
  };

  const createTemplateWithExercises = async () => {
    setSaving(true);
    try {
      const exercisesToSave =
        draftExercises.length > 0
          ? draftExercises
          : [
              {
                exerciseName: exerciseName || t("plans.defaultExercise"),
                sets: Number(sets || "4"),
                reps: Number(reps || "10"),
                imageKey: "dumbbell"
              }
            ];

      await saveTemplateForDay({
        weekday,
        name: templateName || `${t("plans.defaultName")} ${weekdayLabel}`,
        muscleGroup: muscleGroup || t("plans.defaultMuscle"),
        exercises: exercisesToSave
      });
      setExerciseName("");
      setTemplateName("");
      setMuscleGroup("");
      setDraftExercises([]);
    } finally {
      setSaving(false);
    }
  };

  const createLibraryExercise = async () => {
    if (!newExerciseName.trim()) {
      return;
    }
    await createExerciseLibrary(newExerciseName, "dumbbell");
    setNewExerciseName("");
  };

  return (
    <ScrollView style={{ backgroundColor: isDark ? "#0D1117" : "#F6F8FA" }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("plans.title")}</Text>

      <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("plans.newTemplate")}</Text>
        <TextInput
          style={[styles.input, { color: isDark ? "#E6EDF3" : "#111827", borderColor: isDark ? "#2D3748" : "#D1D5DB" }]}
          placeholder={t("plans.templateName")}
          placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
          value={templateName}
          onChangeText={setTemplateName}
        />
        <TextInput
          style={[styles.input, { color: isDark ? "#E6EDF3" : "#111827", borderColor: isDark ? "#2D3748" : "#D1D5DB" }]}
          placeholder={t("plans.muscleGroup")}
          placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
          value={muscleGroup}
          onChangeText={setMuscleGroup}
        />
        <Pressable style={styles.chip} onPress={() => setWeekday(((weekday + 1) % 7) as Weekday)}>
          <Text style={styles.chipText}>
            {t("plans.day")}: {weekdayLabel}
          </Text>
        </Pressable>
        <TextInput
          style={[styles.input, { color: isDark ? "#E6EDF3" : "#111827", borderColor: isDark ? "#2D3748" : "#D1D5DB" }]}
          placeholder={t("plans.exerciseName")}
          placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
          value={exerciseName}
          onChangeText={setExerciseName}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput, { color: isDark ? "#E6EDF3" : "#111827", borderColor: isDark ? "#2D3748" : "#D1D5DB" }]}
            placeholder={t("plans.sets")}
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            value={sets}
            keyboardType="numeric"
            onChangeText={setSets}
          />
          <TextInput
            style={[styles.input, styles.halfInput, { color: isDark ? "#E6EDF3" : "#111827", borderColor: isDark ? "#2D3748" : "#D1D5DB" }]}
            placeholder={t("plans.reps")}
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            value={reps}
            keyboardType="numeric"
            onChangeText={setReps}
          />
        </View>
        <Pressable style={styles.buttonSecondary} onPress={addDraftExercise}>
          <Text style={styles.buttonSecondaryText}>{t("plans.addExerciseToTemplate")}</Text>
        </Pressable>
        {draftExercises.length > 0 ? (
          <View style={{ gap: 4 }}>
            {draftExercises.map((item, index) => (
              <Text key={`${item.exerciseName}-${index}`} style={{ color: isDark ? "#9CA3AF" : "#4B5563" }}>
                {item.exerciseName} - {item.sets}x{item.reps}
              </Text>
            ))}
          </View>
        ) : null}
        <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={() => void createTemplateWithExercises()} disabled={saving}>
          <Text style={styles.buttonText}>{t("plans.saveTemplate")}</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("plans.newExercise")}</Text>
        <TextInput
          style={[styles.input, { color: isDark ? "#E6EDF3" : "#111827", borderColor: isDark ? "#2D3748" : "#D1D5DB" }]}
          placeholder={t("plans.exerciseName")}
          placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
          value={newExerciseName}
          onChangeText={setNewExerciseName}
        />
        <Pressable style={styles.button} onPress={() => void createLibraryExercise()}>
          <Text style={styles.buttonText}>{t("plans.saveExercise")}</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("plans.currentTemplates")}</Text>
        {templates.length === 0 ? (
          <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{t("plans.noTemplates")}</Text>
        ) : (
          templates.map((item) => (
            <Text key={item.id} style={{ color: isDark ? "#E6EDF3" : "#111827" }}>
              {t("plans.day")}: {t(weekDays.find((entry) => entry.value === item.weekday)?.key ?? "plans.weekday.monday")} - {item.name} ({item.muscleGroup})
            </Text>
          ))
        )}
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("plans.exerciseLibrary")}</Text>
        {exerciseLibrary.length === 0 ? (
          <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{t("plans.noExercises")}</Text>
        ) : (
          exerciseLibrary.map((item) => (
            <Text key={item.id} style={{ color: isDark ? "#E6EDF3" : "#111827" }}>
              {item.name}
            </Text>
          ))
        )}
      </View>
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
    borderRadius: 16,
    padding: 14,
    gap: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700"
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  halfInput: {
    flex: 1
  },
  chip: {
    backgroundColor: "#EEF2FF",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start"
  },
  chipText: {
    color: "#1D4ED8",
    fontWeight: "600"
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  buttonSecondary: {
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center"
  },
  buttonSecondaryText: {
    color: "#1E293B",
    fontWeight: "700"
  }
});
