import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { useTheme } from "../theme/useTheme";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function PlansScreen() {
  const { t } = useI18n();
  const { templates, exerciseLibrary, saveTemplate, fetchTemplateExercises } = useAppContext();
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const [templateName, setTemplateName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [sequenceNumber, setSequenceNumber] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [repScheme, setRepScheme] = useState("4x10");
  const [defaultWeightKg, setDefaultWeightKg] = useState("0");
  const [draftExercises, setDraftExercises] = useState<Array<{ exerciseName: string; repScheme: string; defaultWeightKg: number; imageKey: string }>>([]);
  const [templateCounts, setTemplateCounts] = useState<Record<string, number>>({});

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
    const baseName = templateName.trim() || muscleGroup.trim() || `${t("plans.defaultName")} ${templates.length + 1}`;
    const orderedName = sequenceNumber.trim() ? `${sequenceNumber.trim()}. ${baseName}` : baseName;
    const numericOrder = Number(sequenceNumber.trim());
    const orderIndex = Number.isFinite(numericOrder) ? Math.max(0, numericOrder - 1) : undefined;
    await saveTemplate({
      name: orderedName,
      muscleGroup: muscleGroup.trim() || t("plans.defaultMuscle"),
      assignedWeekdays: [],
      orderIndex,
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

  React.useEffect(() => {
    let active = true;
    const loadCounts = async () => {
      const entries = await Promise.all(
        templates.map(async (item) => {
          const exercises = await fetchTemplateExercises(item.id);
          return [item.id, exercises.length] as const;
        })
      );
      if (active) {
        setTemplateCounts(Object.fromEntries(entries));
      }
    };
    if (templates.length > 0) {
      void loadCounts();
    }
    return () => {
      active = false;
    };
  }, [fetchTemplateExercises, templates]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 8, 18) }]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text, fontFamily: typography.heading }]}>{t("plans.title")}</Text>
        <Badge label={`${templates.length} ${t("plans.active")}`} />
      </View>

      <Card style={[styles.newPlanCard, { borderColor: colors.primarySoft }]}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.title }]}>{t("plans.newPlan")}</Text>
          </View>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>{t("plans.muscleGroup")}</Text>
        <View style={styles.row}>
          <Input placeholder={t("plans.muscleGroup")} value={muscleGroup} onChangeText={setMuscleGroup} style={styles.flex} />
          <Input placeholder={t("plans.sequenceNumber")} value={sequenceNumber} onChangeText={setSequenceNumber} style={styles.smallInput} />
        </View>

        <Card variant="muted" style={styles.exerciseDraftCard}>
          <Text style={[styles.miniTitle, { color: colors.text }]}>{t("plans.addExerciseToTemplate")}</Text>
          <Input placeholder={t("plans.exerciseName")} value={exerciseName} onChangeText={setExerciseName} />
          <View style={styles.row}>
            <Input placeholder={t("plans.repScheme")} value={repScheme} onChangeText={setRepScheme} style={styles.flex} />
            <Input
              placeholder={t("plans.defaultWeightKg")}
              value={defaultWeightKg}
              onChangeText={setDefaultWeightKg}
              keyboardType="numeric"
              style={styles.smallInput}
            />
          </View>
          <Button label={t("plans.addExerciseInline")} variant="outline" onPress={addExercise} leftIcon={<MaterialCommunityIcons name="plus" size={16} color={colors.text} />} />
        </Card>

        {draftExercises.length > 0 ? (
          <View style={styles.listBlock}>
            {draftExercises.map((item, index) => (
              <View key={`${item.exerciseName}-${index}`} style={[styles.listRow, { borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontFamily: typography.body }}>{item.exerciseName}</Text>
                <Text style={{ color: colors.textMuted }}>
                  {item.repScheme} - {item.defaultWeightKg}kg
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <Button
          label={t("plans.saveTemplate")}
          onPress={() => void handleSave()}
          style={[styles.saveButton, { backgroundColor: colors.primarySoft }]}
          leftIcon={<MaterialCommunityIcons name="content-save-outline" size={16} color={colors.primaryStrong} />}
          variant="secondary"
        />
      </Card>

      <View style={styles.sectionHeader}>
        <View style={styles.row}>
          <MaterialCommunityIcons name="dumbbell" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.title }]}>{t("plans.registeredWorkouts")}</Text>
        </View>
      </View>
      {orderedTemplates.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>{t("plans.noTemplates")}</Text>
      ) : (
        orderedTemplates.map((item, index) => (
          <Card key={item.id} style={styles.planListCard}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={[styles.planLabel, { color: colors.textMuted }]}>{t("plans.planLabel", { index: index + 1 })}</Text>
                <Text style={[styles.planTitle, { color: colors.text }]}>{item.muscleGroup}</Text>
                <Text style={{ color: colors.textMuted }}>{t("plans.exerciseCount", { count: templateCounts[item.id] ?? 0 })}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-down" size={18} color={colors.textMuted} />
            </View>
          </Card>
        ))
      )}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.title }]}>{t("plans.registeredExercises")}</Text>
      </View>
      {allExerciseNames.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>{t("plans.noExercises")}</Text>
      ) : (
        allExerciseNames.map((item) => (
          <View key={item} style={[styles.listRow, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text }}>{item}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
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
    paddingBottom: 110,
    gap: 12
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: {
    fontSize: 24,
    fontWeight: "700"
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700"
  },
  sectionHeader: {
    marginTop: 4
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  label: {
    fontSize: 12,
    fontWeight: "700"
  },
  miniTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6
  },
  flex: {
    flex: 1
  },
  smallInput: {
    width: 90
  },
  newPlanCard: {
    borderWidth: 1
  },
  exerciseDraftCard: {
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
  },
  saveButton: {
    borderRadius: 14
  },
  planListCard: {
    borderRadius: 16
  },
  planLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6
  },
  planTitle: {
    fontSize: 16,
    fontWeight: "700"
  }
});
