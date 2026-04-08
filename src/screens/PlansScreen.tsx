import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { useTheme } from "../theme/useTheme";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TEMPLATE_REFRESH_INTERVAL_MONTHS, getTemplatesNeedingRefresh } from "../core/templateRefresh";
import { TemplateExercise } from "../types";
import { simulateTemplateRefreshReminderNow, simulateWorkoutReminderNow } from "../services/notifications";

export function PlansScreen() {
  const { t } = useI18n();
  const {
    templates,
    exerciseLibrary,
    saveTemplate,
    fetchTemplateExercises,
    setTemplateActiveById,
    setTemplateExerciseActiveById,
    language
  } = useAppContext();
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
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [templateExercisesById, setTemplateExercisesById] = useState<Record<string, TemplateExercise[]>>({});
  const [message, setMessage] = useState("");
  const templatesNeedingRefresh = useMemo(() => getTemplatesNeedingRefresh(templates), [templates]);
  const activeTemplatesCount = useMemo(() => templates.filter((item) => item.isActive).length, [templates]);
  const refreshMessageKey = templatesNeedingRefresh.length === 1 ? "plans.refreshBodySingle" : "plans.refreshBodyPlural";

  const allExerciseNames = useMemo(() => {
    const names = new Set<string>();
    exerciseLibrary.forEach((item) => names.add(item.name));
    Object.values(templateExercisesById).forEach((list) => {
      list.forEach((exercise) => names.add(exercise.exerciseName));
    });
    draftExercises.forEach((item) => names.add(item.exerciseName));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [draftExercises, exerciseLibrary, templateExercisesById]);

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

  useEffect(() => {
    let active = true;

    const loadCounts = async () => {
      const entries = await Promise.all(
        templates.map(async (item) => {
          const exercises = await fetchTemplateExercises(item.id, true);
          return [item.id, exercises.filter((exercise) => exercise.isActive).length] as const;
        })
      );
      if (active) {
        setTemplateCounts(Object.fromEntries(entries));
      }
    };

    if (templates.length > 0) {
      void loadCounts();
    } else {
      setTemplateCounts({});
    }

    return () => {
      active = false;
    };
  }, [fetchTemplateExercises, templates]);

  const handleToggleTemplateDetails = async (templateId: string) => {
    const shouldExpand = expandedTemplateId !== templateId;
    setExpandedTemplateId(shouldExpand ? templateId : null);
    if (!shouldExpand || loadingTemplateId === templateId) {
      return;
    }
    setLoadingTemplateId(templateId);
    try {
      const exercises = await fetchTemplateExercises(templateId, true);
      setTemplateExercisesById((current) => ({ ...current, [templateId]: exercises }));
      setTemplateCounts((current) => ({
        ...current,
        [templateId]: exercises.filter((exercise) => exercise.isActive).length
      }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("settings.authError"));
    } finally {
      setLoadingTemplateId((current) => (current === templateId ? null : current));
    }
  };

  const reloadTemplateDetails = async (templateId: string) => {
    const exercises = await fetchTemplateExercises(templateId, true);
    setTemplateExercisesById((current) => ({ ...current, [templateId]: exercises }));
    setTemplateCounts((current) => ({
      ...current,
      [templateId]: exercises.filter((item) => item.isActive).length
    }));
  };

  const handleToggleTemplateActive = async (templateId: string, isActive: boolean) => {
    await setTemplateActiveById(templateId, isActive);
    setMessage(isActive ? t("plans.templateActivated") : t("plans.templateDeactivated"));
  };

  const handleToggleExerciseActive = async (templateId: string, exerciseId: string, isActive: boolean) => {
    await setTemplateExerciseActiveById(exerciseId, isActive);
    await reloadTemplateDetails(templateId);
    setMessage(isActive ? t("plans.exerciseActivated") : t("plans.exerciseDeactivated"));
  };

  const handleSimulateWorkoutReminder = async () => {
    try {
      await simulateWorkoutReminderNow(language);
      setMessage(t("plans.simulationSent"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("settings.authError"));
    }
  };

  const handleSimulateTemplateRefreshReminder = async () => {
    try {
      await simulateTemplateRefreshReminderNow(language, Math.max(1, templatesNeedingRefresh.length));
      setMessage(t("plans.simulationSent"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("settings.authError"));
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 8, 18) }]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text, fontFamily: typography.heading }]}>{t("plans.title")}</Text>
        <Badge label={`${activeTemplatesCount} ${t("plans.active")}`} />
      </View>

      {templatesNeedingRefresh.length > 0 ? (
        <Card style={[styles.refreshCard, { borderColor: colors.warning, backgroundColor: colors.surfaceAlt }]}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="clock-alert-outline" size={18} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.title }]}>{t("plans.refreshTitle")}</Text>
          </View>
          <Text style={{ color: colors.textMuted, fontFamily: typography.body }}>
            {t(refreshMessageKey, { count: templatesNeedingRefresh.length, months: TEMPLATE_REFRESH_INTERVAL_MONTHS })}
          </Text>
          <Button
            label={t("plans.simulateTemplateRefreshReminder")}
            size="sm"
            variant="outline"
            onPress={() => void handleSimulateTemplateRefreshReminder()}
          />
        </Card>
      ) : null}

      <Card>
        <View style={styles.row}>
          <MaterialCommunityIcons name="bell-ring-outline" size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.title }]}>{t("plans.reminderSimulationTitle")}</Text>
        </View>
        <View style={styles.row}>
          <Button label={t("plans.simulateWorkoutReminder")} size="sm" onPress={() => void handleSimulateWorkoutReminder()} />
          <Button
            label={t("plans.simulateTemplateRefreshReminder")}
            size="sm"
            variant="outline"
            onPress={() => void handleSimulateTemplateRefreshReminder()}
          />
        </View>
      </Card>

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
            <Pressable onPress={() => void handleToggleTemplateDetails(item.id)} style={styles.expandPressable} hitSlop={8}>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={[styles.planLabel, { color: colors.textMuted }]}>{t("plans.planLabel", { index: index + 1 })}</Text>
                  <Text style={[styles.planTitle, { color: colors.text }]}>{item.muscleGroup}</Text>
                  <View style={styles.templateMetaRow}>
                    <Text style={{ color: colors.textMuted }}>{t("plans.exerciseCount", { count: templateCounts[item.id] ?? 0 })}</Text>
                    <Badge label={item.isActive ? t("plans.activeState") : t("plans.inactiveState")} variant={item.isActive ? "success" : "warning"} />
                  </View>
                </View>
                <MaterialCommunityIcons
                  name={expandedTemplateId === item.id ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.textMuted}
                />
              </View>
            </Pressable>

            <View style={styles.templateActionsRow}>
              <Button
                label={item.isActive ? t("plans.deactivateTemplate") : t("plans.activateTemplate")}
                size="sm"
                variant={item.isActive ? "outline" : "secondary"}
                onPress={() => void handleToggleTemplateActive(item.id, !item.isActive)}
              />
            </View>

            {expandedTemplateId === item.id ? (
              <View style={[styles.templateExercisesBlock, { borderColor: colors.border }]}>
                {loadingTemplateId === item.id ? (
                  <Text style={{ color: colors.textMuted }}>{t("plans.loadingExercises")}</Text>
                ) : (templateExercisesById[item.id] ?? []).length === 0 ? (
                  <Text style={{ color: colors.textMuted }}>{t("plans.noExercises")}</Text>
                ) : (
                  (templateExercisesById[item.id] ?? []).map((exercise) => (
                    <View key={exercise.id} style={[styles.exerciseRow, { borderColor: colors.border }]}>
                      <View style={styles.exerciseTextWrap}>
                        <Text style={[styles.exerciseTitle, { color: colors.text }]}>{exercise.exerciseName}</Text>
                        <Text style={{ color: colors.textMuted }}>
                          {exercise.repScheme} - {exercise.defaultWeightKg}kg
                        </Text>
                      </View>
                      <View style={styles.exerciseActionWrap}>
                        <Badge
                          label={exercise.isActive ? t("plans.activeState") : t("plans.inactiveState")}
                          variant={exercise.isActive ? "success" : "warning"}
                        />
                        <Button
                          label={exercise.isActive ? t("plans.deactivateExercise") : t("plans.activateExercise")}
                          size="sm"
                          variant="outline"
                          onPress={() => void handleToggleExerciseActive(item.id, exercise.id, !exercise.isActive)}
                        />
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : null}
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

      {message ? (
        <Card variant="muted">
          <Text style={{ color: colors.text }}>{message}</Text>
        </Card>
      ) : null}
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
  refreshCard: {
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
    borderRadius: 16,
    gap: 8
  },
  expandPressable: {
    gap: 8
  },
  templateMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  templateActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  templateExercisesBlock: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 8
  },
  exerciseRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8
  },
  exerciseTextWrap: {
    gap: 2
  },
  exerciseActionWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  exerciseTitle: {
    fontSize: 14,
    fontWeight: "700"
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
