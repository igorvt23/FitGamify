import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";

export function PlansScreen() {
  const { t } = useI18n();
  const isDark = useColorScheme() === "dark";
  const { templates, exerciseLibrary, saveTemplate } = useAppContext();

  const [templateName, setTemplateName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [sequenceNumber, setSequenceNumber] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [repScheme, setRepScheme] = useState("4x10");
  const [defaultWeightKg, setDefaultWeightKg] = useState("0");
  const [draftExercises, setDraftExercises] = useState<Array<{ exerciseName: string; repScheme: string; defaultWeightKg: number; imageKey: string }>>([]);

  const allExerciseNames = useMemo(() => {
    const names = new Set<string>();
    exerciseLibrary.forEach((item) => names.add(item.name));
    templates.forEach((template) => {
      if (template.name) {
        names.add(template.name);
      }
    });
    draftExercises.forEach((item) => names.add(item.exerciseName));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [draftExercises, exerciseLibrary, templates]);

  const addExercise = () => {
    if (!exerciseName.trim()) {
      return;
    }
    setDraftExercises((prev) => [
      ...prev,
      {
        exerciseName: exerciseName.trim(),
        repScheme: normalizeRepScheme(repScheme),
        defaultWeightKg: normalizeWeight(defaultWeightKg),
        imageKey: "dumbbell"
      }
    ]);
    setExerciseName("");
    setRepScheme("4x10");
    setDefaultWeightKg("0");
  };

  const handleSave = async () => {
    const baseName = templateName.trim() || `${t("plans.defaultName")} ${templates.length + 1}`;
    const orderedName = sequenceNumber.trim() ? `${sequenceNumber.trim()}. ${baseName}` : baseName;
    await saveTemplate({
      name: orderedName,
      muscleGroup: muscleGroup.trim() || t("plans.defaultMuscle"),
      assignedWeekdays: [],
      orderIndex: sequenceNumber.trim() ? Math.max(0, Number(sequenceNumber.trim()) - 1 || 0) : undefined,
      exercises:
        draftExercises.length > 0
          ? draftExercises
          : [
              {
                exerciseName: exerciseName.trim() || t("plans.defaultExercise"),
                repScheme: normalizeRepScheme(repScheme),
                defaultWeightKg: normalizeWeight(defaultWeightKg),
                imageKey: "dumbbell"
              }
            ]
    });
    setTemplateName("");
    setMuscleGroup("");
    setSequenceNumber("");
    setExerciseName("");
    setRepScheme("4x10");
    setDefaultWeightKg("0");
    setDraftExercises([]);
  };
  const orderedTemplates = useMemo(() => [...templates], [templates]);

  return (
    <ScrollView style={{ backgroundColor: isDark ? "#0D1117" : "#F6F8FA" }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("plans.title")}</Text>

      <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("plans.quickCreate")}</Text>
        <TextInput
          style={[styles.input, themedBorder(isDark)]}
          placeholder={t("plans.templateName")}
          placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
          value={templateName}
          onChangeText={setTemplateName}
        />
        <TextInput
          style={[styles.input, themedBorder(isDark)]}
          placeholder={t("plans.muscleGroup")}
          placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
          value={muscleGroup}
          onChangeText={setMuscleGroup}
        />
        <TextInput
          style={[styles.input, themedBorder(isDark)]}
          placeholder={t("plans.sequenceNumber")}
          placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
          value={sequenceNumber}
          onChangeText={setSequenceNumber}
          keyboardType="numeric"
        />

        <View style={[styles.exerciseDraftCard, { borderColor: isDark ? "#2D3748" : "#E5E7EB" }]}>
          <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "700" }}>{t("plans.addExerciseToTemplate")}</Text>
          <TextInput
            style={[styles.input, themedBorder(isDark)]}
            placeholder={t("plans.exerciseName")}
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            value={exerciseName}
            onChangeText={setExerciseName}
          />
          <TextInput
            style={[styles.input, themedBorder(isDark)]}
            placeholder={t("plans.repScheme")}
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            value={repScheme}
            onChangeText={setRepScheme}
          />
          <TextInput
            style={[styles.input, themedBorder(isDark)]}
            placeholder={t("plans.defaultWeightKg")}
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            value={defaultWeightKg}
            onChangeText={setDefaultWeightKg}
            keyboardType="numeric"
          />
          <Pressable style={styles.secondaryButton} onPress={addExercise}>
            <Text style={styles.secondaryButtonText}>{t("plans.addExerciseInline")}</Text>
          </Pressable>
        </View>

        {draftExercises.length > 0 ? (
          <View style={styles.listBlock}>
            {draftExercises.map((item, index) => (
              <View key={`${item.exerciseName}-${index}`} style={[styles.listRow, { borderColor: isDark ? "#2D3748" : "#E5E7EB" }]}>
                <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "700" }}>{item.exerciseName}</Text>
                <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>
                  {item.repScheme} - {item.defaultWeightKg}kg
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <Pressable style={styles.button} onPress={() => void handleSave()}>
          <Text style={styles.buttonText}>{t("plans.saveTemplate")}</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("plans.registeredWorkouts")}</Text>
        {orderedTemplates.length === 0 ? (
          <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{t("plans.noTemplates")}</Text>
        ) : (
          orderedTemplates.map((item, index) => (
            <View key={item.id} style={[styles.listRow, { borderColor: isDark ? "#2D3748" : "#E5E7EB" }]}>
              <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "700" }}>
                #{index + 1} {item.name}
              </Text>
              <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{item.muscleGroup}</Text>
            </View>
          ))
        )}
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("plans.registeredExercises")}</Text>
        {allExerciseNames.length === 0 ? (
          <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{t("plans.noExercises")}</Text>
        ) : (
          allExerciseNames.map((item) => (
            <View key={item} style={[styles.listRow, { borderColor: isDark ? "#2D3748" : "#E5E7EB" }]}>
              <Text style={{ color: isDark ? "#E6EDF3" : "#111827" }}>{item}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function themedBorder(isDark: boolean) {
  return {
    color: isDark ? "#E6EDF3" : "#111827",
    borderColor: isDark ? "#2D3748" : "#D1D5DB"
  };
}

function normalizeRepScheme(value: string) {
  const normalized = value.replace(/\s+/g, "");
  return normalized.length > 0 ? normalized : "4x10";
}

function normalizeWeight(value: string) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
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
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  secondaryButton: {
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center"
  },
  secondaryButtonText: {
    color: "#1E293B",
    fontWeight: "700"
  },
  exerciseDraftCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8
  },
  listBlock: {
    gap: 8
  },
  listRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 4
  }
});
