import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAppContext } from "../state/AppContext";
import { TemplateExercise, Weekday, WorkoutTemplate } from "../types";
import { useI18n } from "../i18n";

type ExerciseDraft = {
  exerciseName: string;
  repScheme: string;
  defaultWeightKg: string;
};

const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

export function PlansScreen() {
  const { t } = useI18n();
  const isDark = useColorScheme() === "dark";
  const {
    templates,
    exerciseLibrary,
    createExerciseLibrary,
    saveTemplate,
    moveTemplate,
    updateTemplateInfo,
    deleteTemplateById,
    addExerciseToTemplateById,
    updateTemplateExerciseById,
    deleteTemplateExerciseById,
    fetchTemplateExercises,
    scheduleMode,
    setWorkoutScheduleMode
  } = useAppContext();

  const [templateName, setTemplateName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [repScheme, setRepScheme] = useState("4x10");
  const [draftExercises, setDraftExercises] = useState<Array<{ exerciseName: string; repScheme: string; defaultWeightKg: number; imageKey: string }>>([]);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [saving, setSaving] = useState(false);
  const [draftWeekdays, setDraftWeekdays] = useState<Weekday[]>([]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplateExercises, setSelectedTemplateExercises] = useState<TemplateExercise[]>([]);
  const [templateEditName, setTemplateEditName] = useState("");
  const [templateEditMuscleGroup, setTemplateEditMuscleGroup] = useState("");
  const [templateEditWeekdays, setTemplateEditWeekdays] = useState<Weekday[]>([]);
  const [exerciseEdits, setExerciseEdits] = useState<Record<string, ExerciseDraft>>({});
  const [newExerciseDraft, setNewExerciseDraft] = useState<ExerciseDraft>({
    exerciseName: "",
    repScheme: "4x10",
    defaultWeightKg: "0"
  });

  const addDraftExercise = () => {
    if (!exerciseName.trim()) {
      return;
    }

    setDraftExercises((prev) => [
      ...prev,
      {
        exerciseName: exerciseName.trim(),
        repScheme: normalizeRepScheme(repScheme),
        defaultWeightKg: normalizeWeight(newExerciseDraft.defaultWeightKg),
        imageKey: "dumbbell"
      }
    ]);
    setExerciseName("");
    setRepScheme("4x10");
    setNewExerciseDraft((prev) => ({ ...prev, defaultWeightKg: "0" }));
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
                repScheme: normalizeRepScheme(repScheme),
                defaultWeightKg: normalizeWeight(newExerciseDraft.defaultWeightKg),
                imageKey: "dumbbell"
              }
            ];

      await saveTemplate({
        name: templateName || `${t("plans.defaultName")} ${templates.length + 1}`,
        muscleGroup: muscleGroup || t("plans.defaultMuscle"),
        assignedWeekdays: draftWeekdays,
        exercises: exercisesToSave
      });

      setExerciseName("");
      setTemplateName("");
      setMuscleGroup("");
      setRepScheme("4x10");
      setDraftExercises([]);
      setDraftWeekdays([]);
      setNewExerciseDraft({ exerciseName: "", repScheme: "4x10", defaultWeightKg: "0" });
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

  const selectTemplate = async (template: WorkoutTemplate) => {
    if (selectedTemplateId === template.id) {
      setSelectedTemplateId(null);
      setSelectedTemplateExercises([]);
      setExerciseEdits({});
      setTemplateEditWeekdays([]);
      return;
    }

    const exercises = await fetchTemplateExercises(template.id);
    const edits: Record<string, ExerciseDraft> = {};
    for (const item of exercises) {
      edits[item.id] = {
        exerciseName: item.exerciseName,
        repScheme: item.repScheme,
        defaultWeightKg: String(item.defaultWeightKg ?? 0)
      };
    }

    setSelectedTemplateId(template.id);
    setSelectedTemplateExercises(exercises);
    setTemplateEditName(template.name);
    setTemplateEditMuscleGroup(template.muscleGroup);
    setTemplateEditWeekdays(template.assignedWeekdays);
    setExerciseEdits(edits);
    setNewExerciseDraft({ exerciseName: "", repScheme: "4x10", defaultWeightKg: "0" });
  };

  const saveTemplateMeta = async () => {
    if (!selectedTemplateId) {
      return;
    }
    await updateTemplateInfo(selectedTemplateId, templateEditName, templateEditMuscleGroup, templateEditWeekdays);
  };

  const reloadSelectedTemplate = async (templateId: string) => {
    const exercises = await fetchTemplateExercises(templateId);
    const selectedTemplate = templates.find((item) => item.id === templateId);
    const edits: Record<string, ExerciseDraft> = {};
    for (const item of exercises) {
      edits[item.id] = {
        exerciseName: item.exerciseName,
        repScheme: item.repScheme,
        defaultWeightKg: String(item.defaultWeightKg ?? 0)
      };
    }
    setSelectedTemplateExercises(exercises);
    setExerciseEdits(edits);
    if (selectedTemplate) {
      setTemplateEditWeekdays(selectedTemplate.assignedWeekdays);
    }
  };

  const saveExerciseEdit = async (exerciseId: string) => {
    const draft = exerciseEdits[exerciseId];
    if (!draft) {
      return;
    }
    await updateTemplateExerciseById({
      exerciseId,
      exerciseName: draft.exerciseName,
      repScheme: draft.repScheme,
      defaultWeightKg: normalizeWeight(draft.defaultWeightKg),
      imageKey: "dumbbell"
    });
    if (selectedTemplateId) {
      await reloadSelectedTemplate(selectedTemplateId);
    }
  };

  const addExerciseToSelectedTemplate = async () => {
    if (!selectedTemplateId || !newExerciseDraft.exerciseName.trim()) {
      return;
    }
    await addExerciseToTemplateById({
      templateId: selectedTemplateId,
      exerciseName: newExerciseDraft.exerciseName.trim(),
      repScheme: normalizeRepScheme(newExerciseDraft.repScheme),
      defaultWeightKg: normalizeWeight(newExerciseDraft.defaultWeightKg),
      imageKey: "dumbbell"
    });
    await reloadSelectedTemplate(selectedTemplateId);
    setNewExerciseDraft({ exerciseName: "", repScheme: "4x10", defaultWeightKg: "0" });
  };

  const deleteExerciseFromSelectedTemplate = async (exerciseId: string) => {
    await deleteTemplateExerciseById(exerciseId);
    if (selectedTemplateId) {
      await reloadSelectedTemplate(selectedTemplateId);
    }
  };

  const deleteSelectedTemplate = async () => {
    if (!selectedTemplateId) {
      return;
    }
    await deleteTemplateById(selectedTemplateId);
    setSelectedTemplateId(null);
    setSelectedTemplateExercises([]);
    setExerciseEdits({});
    setTemplateEditWeekdays([]);
  };

  return (
    <ScrollView style={{ backgroundColor: isDark ? "#0D1117" : "#F6F8FA" }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("plans.title")}</Text>

      <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("plans.modeTitle")}</Text>
        <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{t("plans.modeHint")}</Text>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeButton, scheduleMode === "sequence" && styles.modeButtonActive]}
            onPress={() => void setWorkoutScheduleMode("sequence")}
          >
            <Text style={[styles.modeButtonText, scheduleMode === "sequence" && styles.modeButtonTextActive]}>{t("plans.modeSequence")}</Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, scheduleMode === "weekday" && styles.modeButtonActive]}
            onPress={() => void setWorkoutScheduleMode("weekday")}
          >
            <Text style={[styles.modeButtonText, scheduleMode === "weekday" && styles.modeButtonTextActive]}>{t("plans.modeWeekday")}</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>
          {scheduleMode === "sequence" ? t("plans.sequenceTitle") : t("plans.weekdayTitle")}
        </Text>
        <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>
          {scheduleMode === "sequence" ? t("plans.sequenceHint") : t("plans.weekdayHint")}
        </Text>
        {templates.map((item, index) => (
          <View key={item.id} style={[styles.sequenceItem, { borderColor: isDark ? "#2D3748" : "#E5E7EB" }]}>
            <Pressable style={{ flex: 1 }} onPress={() => void selectTemplate(item)}>
              <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "700" }}>
                {scheduleMode === "sequence" ? `${index + 1}. ` : ""}
                {item.name}
              </Text>
              <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{item.muscleGroup}</Text>
              {scheduleMode === "weekday" ? (
                <Text style={{ color: isDark ? "#60A5FA" : "#1D4ED8" }}>{formatWeekdays(item.assignedWeekdays, t)}</Text>
              ) : null}
            </Pressable>
            {scheduleMode === "sequence" ? (
              <>
                <Pressable style={styles.iconButton} onPress={() => void moveTemplate(item.id, "up")}>
                  <MaterialCommunityIcons name="chevron-up" size={20} color="#1D4ED8" />
                </Pressable>
                <Pressable style={styles.iconButton} onPress={() => void moveTemplate(item.id, "down")}>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#1D4ED8" />
                </Pressable>
              </>
            ) : null}
          </View>
        ))}
      </View>

      {selectedTemplateId ? (
        <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("plans.editTemplate")}</Text>
          <TextInput
            style={[styles.input, themedBorder(isDark)]}
            value={templateEditName}
            onChangeText={setTemplateEditName}
            placeholder={t("plans.templateName")}
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
          />
          <TextInput
            style={[styles.input, themedBorder(isDark)]}
            value={templateEditMuscleGroup}
            onChangeText={setTemplateEditMuscleGroup}
            placeholder={t("plans.muscleGroup")}
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
          />
          {scheduleMode === "weekday" ? (
            <View>
              <Text style={[styles.label, { color: isDark ? "#E6EDF3" : "#111827" }]}>{t("plans.assignedDays")}</Text>
              <WeekdaySelector value={templateEditWeekdays} onChange={setTemplateEditWeekdays} isDark={isDark} t={t} />
            </View>
          ) : null}
          <View style={styles.row}>
            <Pressable style={[styles.button, styles.half]} onPress={() => void saveTemplateMeta()}>
              <Text style={styles.buttonText}>{t("plans.saveTemplateMeta")}</Text>
            </Pressable>
            <Pressable style={[styles.dangerButton, styles.half]} onPress={() => void deleteSelectedTemplate()}>
              <Text style={styles.buttonText}>{t("plans.deleteTemplate")}</Text>
            </Pressable>
          </View>

          {selectedTemplateExercises.map((item) => {
            const draft = exerciseEdits[item.id];
            if (!draft) {
              return null;
            }
            return (
              <View key={item.id} style={[styles.exerciseEditor, { borderColor: isDark ? "#2D3748" : "#E5E7EB" }]}>
                <TextInput
                  style={[styles.input, themedBorder(isDark)]}
                  value={draft.exerciseName}
                  onChangeText={(value) => setExerciseEdits((prev) => ({ ...prev, [item.id]: { ...prev[item.id], exerciseName: value } }))}
                  placeholder={t("plans.exerciseName")}
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                />
                <TextInput
                  style={[styles.input, themedBorder(isDark)]}
                  value={draft.repScheme}
                  onChangeText={(value) => setExerciseEdits((prev) => ({ ...prev, [item.id]: { ...prev[item.id], repScheme: value } }))}
                  placeholder={t("plans.repScheme")}
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                />
                <TextInput
                  style={[styles.input, themedBorder(isDark)]}
                  value={draft.defaultWeightKg}
                  onChangeText={(value) => setExerciseEdits((prev) => ({ ...prev, [item.id]: { ...prev[item.id], defaultWeightKg: value } }))}
                  placeholder={t("plans.defaultWeightKg")}
                  keyboardType="numeric"
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                />
                <View style={styles.row}>
                  <Pressable style={[styles.button, styles.half]} onPress={() => void saveExerciseEdit(item.id)}>
                    <Text style={styles.buttonText}>{t("plans.saveExerciseRow")}</Text>
                  </Pressable>
                  <Pressable style={[styles.dangerButton, styles.half]} onPress={() => void deleteExerciseFromSelectedTemplate(item.id)}>
                    <Text style={styles.buttonText}>{t("plans.deleteExerciseRow")}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          <View style={[styles.exerciseEditor, { borderColor: isDark ? "#2D3748" : "#E5E7EB" }]}>
            <Text style={{ color: isDark ? "#E6EDF3" : "#111827", fontWeight: "700" }}>{t("plans.addExerciseInline")}</Text>
            <TextInput
              style={[styles.input, themedBorder(isDark)]}
              value={newExerciseDraft.exerciseName}
              onChangeText={(value) => setNewExerciseDraft((prev) => ({ ...prev, exerciseName: value }))}
              placeholder={t("plans.exerciseName")}
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            />
            <TextInput
              style={[styles.input, themedBorder(isDark)]}
              value={newExerciseDraft.repScheme}
              onChangeText={(value) => setNewExerciseDraft((prev) => ({ ...prev, repScheme: value }))}
              placeholder={t("plans.repScheme")}
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            />
            <TextInput
              style={[styles.input, themedBorder(isDark)]}
              value={newExerciseDraft.defaultWeightKg}
              onChangeText={(value) => setNewExerciseDraft((prev) => ({ ...prev, defaultWeightKg: value }))}
              placeholder={t("plans.defaultWeightKg")}
              keyboardType="numeric"
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            />
            <Pressable style={styles.button} onPress={() => void addExerciseToSelectedTemplate()}>
              <Text style={styles.buttonText}>{t("plans.addExerciseInline")}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#F0F6FC" : "#111827" }]}>{t("plans.newTemplate")}</Text>
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
        {scheduleMode === "weekday" ? (
          <View>
            <Text style={[styles.label, { color: isDark ? "#E6EDF3" : "#111827" }]}>{t("plans.assignedDays")}</Text>
            <WeekdaySelector value={draftWeekdays} onChange={setDraftWeekdays} isDark={isDark} t={t} />
            <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{t("plans.multiPerDayHint")}</Text>
          </View>
        ) : (
          <Text style={{ color: isDark ? "#9CA3AF" : "#6B7280" }}>{t("plans.sequenceMultiHint")}</Text>
        )}
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
          value={newExerciseDraft.defaultWeightKg}
          keyboardType="numeric"
          onChangeText={(value) => setNewExerciseDraft((prev) => ({ ...prev, defaultWeightKg: value }))}
        />
        <Pressable style={styles.buttonSecondary} onPress={addDraftExercise}>
          <Text style={styles.buttonSecondaryText}>{t("plans.addExerciseToTemplate")}</Text>
        </Pressable>
        {draftExercises.length > 0 ? (
          <View style={{ gap: 4 }}>
            {draftExercises.map((item, index) => (
              <Text key={`${item.exerciseName}-${index}`} style={{ color: isDark ? "#9CA3AF" : "#4B5563" }}>
                {item.exerciseName} - {item.repScheme} - {item.defaultWeightKg}kg
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
          style={[styles.input, themedBorder(isDark)]}
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

function WeekdaySelector({
  value,
  onChange,
  isDark,
  t
}: {
  value: Weekday[];
  onChange: (next: Weekday[]) => void;
  isDark: boolean;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.weekdayRow}>
      {WEEKDAY_KEYS.map((key, index) => {
        const weekday = index as Weekday;
        const selected = value.includes(weekday);
        return (
          <Pressable
            key={key}
            style={[
              styles.weekdayChip,
              { backgroundColor: selected ? "#2563EB" : isDark ? "#0F172A" : "#E5E7EB" }
            ]}
            onPress={() =>
              onChange(selected ? value.filter((item) => item !== weekday) : [...value, weekday].sort((a, b) => a - b))
            }
          >
            <Text style={{ color: selected ? "#FFFFFF" : isDark ? "#CBD5E1" : "#334155", fontWeight: "700" }}>
              {t(`plans.weekday.${key}`).slice(0, 3)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function themedBorder(isDark: boolean) {
  return {
    color: isDark ? "#E6EDF3" : "#111827",
    borderColor: isDark ? "#2D3748" : "#D1D5DB"
  };
}

function formatWeekdays(weekdays: Weekday[], t: (key: string) => string) {
  if (weekdays.length === 0) {
    return t("plans.noAssignedDays");
  }
  return weekdays.map((item) => t(`plans.weekday.${WEEKDAY_KEYS[item]}`).slice(0, 3)).join(", ");
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
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6
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
  dangerButton: {
    backgroundColor: "#DC2626",
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
  },
  modeRow: {
    flexDirection: "row",
    gap: 8
  },
  modeButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    paddingVertical: 12,
    alignItems: "center"
  },
  modeButtonActive: {
    backgroundColor: "#2563EB"
  },
  modeButtonText: {
    color: "#1F2937",
    fontWeight: "700"
  },
  modeButtonTextActive: {
    color: "#FFFFFF"
  },
  sequenceItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center"
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  half: {
    flex: 1
  },
  exerciseEditor: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8
  },
  weekdayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  weekdayChip: {
    minWidth: 44,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center"
  }
});

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
