import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { TEMPLATE_REFRESH_INTERVAL_MONTHS, getTemplatesNeedingRefresh } from "../core/templateRefresh";
import { useI18n } from "../i18n";
import { useAppContext } from "../state/AppContext";
import { useTheme } from "../theme/useTheme";
import { TemplateExercise, WorkoutTemplate } from "../types";

type DraftExercise = {
  exerciseName: string;
  repScheme: string;
  defaultWeightLabel: string;
  imageKey: string;
};

type ExerciseEditDraft = {
  exerciseName: string;
  repScheme: string;
  defaultWeightLabel: string;
};

export function PlansScreen() {
  const { t } = useI18n();
  const {
    templates,
    exerciseLibrary,
    saveTemplate,
    fetchTemplateExercises,
    setTemplateActiveById,
    setTemplateExerciseActiveById,
    updateTemplateInfo,
    updateTemplateExerciseById,
    moveTemplate
  } = useAppContext();
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const [templateName, setTemplateName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [sequenceNumber, setSequenceNumber] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [repScheme, setRepScheme] = useState("4x10");
  const [defaultWeightLabel, setDefaultWeightLabel] = useState("0");
  const [draftExercises, setDraftExercises] = useState<DraftExercise[]>([]);
  const [templateCounts, setTemplateCounts] = useState<Record<string, number>>({});
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [templateExercisesById, setTemplateExercisesById] = useState<Record<string, TemplateExercise[]>>({});
  const [message, setMessage] = useState("");
  const [showNewPlanCard, setShowNewPlanCard] = useState(true);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateMuscleGroup, setEditingTemplateMuscleGroup] = useState("");
  const [editingExerciseDrafts, setEditingExerciseDrafts] = useState<Record<string, ExerciseEditDraft>>({});

  const orderedTemplates = useMemo(() => templates.filter((item) => item.isActive), [templates]);
  const templatesNeedingRefresh = useMemo(() => getTemplatesNeedingRefresh(orderedTemplates), [orderedTemplates]);
  const activeTemplatesCount = orderedTemplates.length;
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

  useEffect(() => {
    let active = true;

    const loadCounts = async () => {
      const entries = await Promise.all(
        orderedTemplates.map(async (item) => {
          const exercises = await fetchTemplateExercises(item.id);
          return [item.id, exercises.length] as const;
        })
      );
      if (active) {
        setTemplateCounts(Object.fromEntries(entries));
      }
    };

    if (orderedTemplates.length > 0) {
      void loadCounts();
    } else {
      setTemplateCounts({});
    }

    return () => {
      active = false;
    };
  }, [fetchTemplateExercises, orderedTemplates]);

  const addExercise = () => {
    if (!exerciseName.trim()) {
      return;
    }

    setDraftExercises((prev) => [
      ...prev,
      {
        exerciseName: exerciseName.trim(),
        repScheme: normalizeRepScheme(repScheme),
        defaultWeightLabel: normalizeWeightLabel(defaultWeightLabel),
        imageKey: "dumbbell"
      }
    ]);
    setExerciseName("");
    setRepScheme("4x10");
    setDefaultWeightLabel("0");
  };

  const handleSave = async () => {
    const baseName = templateName.trim() || muscleGroup.trim() || `${t("plans.defaultName")} ${orderedTemplates.length + 1}`;
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
                defaultWeightLabel: normalizeWeightLabel(defaultWeightLabel),
                imageKey: "dumbbell"
              }
            ]
    });

    setTemplateName("");
    setMuscleGroup("");
    setSequenceNumber("");
    setExerciseName("");
    setRepScheme("4x10");
    setDefaultWeightLabel("0");
    setDraftExercises([]);
    setMessage("");
  };

  const ensureTemplateDetailsLoaded = async (templateId: string) => {
    const cached = templateExercisesById[templateId];
    if (cached) {
      return cached;
    }

    setLoadingTemplateId(templateId);
    try {
      const exercises = await fetchTemplateExercises(templateId);
      setTemplateExercisesById((current) => ({ ...current, [templateId]: exercises }));
      setTemplateCounts((current) => ({ ...current, [templateId]: exercises.length }));
      return exercises;
    } finally {
      setLoadingTemplateId((current) => (current === templateId ? null : current));
    }
  };

  const handleToggleTemplateDetails = async (templateId: string) => {
    const shouldExpand = expandedTemplateId !== templateId;
    setExpandedTemplateId(shouldExpand ? templateId : null);
    if (!shouldExpand || loadingTemplateId === templateId) {
      return;
    }

    try {
      await ensureTemplateDetailsLoaded(templateId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("settings.authError"));
    }
  };

  const reloadTemplateDetails = async (templateId: string) => {
    const exercises = await fetchTemplateExercises(templateId);
    setTemplateExercisesById((current) => ({ ...current, [templateId]: exercises }));
    setTemplateCounts((current) => ({
      ...current,
      [templateId]: exercises.length
    }));
    return exercises;
  };

  const handleToggleTemplateActive = async (templateId: string) => {
    await setTemplateActiveById(templateId, false);
    if (expandedTemplateId === templateId) {
      setExpandedTemplateId(null);
    }
    if (editingTemplateId === templateId) {
      setEditingTemplateId(null);
      setEditingTemplateMuscleGroup("");
      setEditingExerciseDrafts({});
    }

    setTemplateExercisesById((current) => {
      const next = { ...current };
      delete next[templateId];
      return next;
    });
    setTemplateCounts((current) => {
      const next = { ...current };
      delete next[templateId];
      return next;
    });
    setMessage(t("plans.templateDeactivated"));
  };

  const handleToggleExerciseActive = async (templateId: string, exerciseId: string) => {
    await setTemplateExerciseActiveById(exerciseId, false);
    const nextExercises = await reloadTemplateDetails(templateId);

    setEditingExerciseDrafts((current) => {
      const next = { ...current };
      delete next[exerciseId];
      return next;
    });

    if (nextExercises.length === 0) {
      setEditingTemplateId(null);
      setEditingTemplateMuscleGroup("");
      setEditingExerciseDrafts({});
    }

    setMessage(t("plans.exerciseDeactivated"));
  };

  const handleStartTemplateEdit = async (item: WorkoutTemplate) => {
    const exercises = await ensureTemplateDetailsLoaded(item.id);
    setExpandedTemplateId(item.id);
    setEditingTemplateId(item.id);
    setEditingTemplateMuscleGroup(item.muscleGroup);
    setEditingExerciseDrafts(
      Object.fromEntries(
        exercises.map((exercise) => [
          exercise.id,
          {
            exerciseName: exercise.exerciseName,
            repScheme: exercise.repScheme,
            defaultWeightLabel: normalizeWeightLabel(exercise.defaultWeightLabel)
          }
        ])
      )
    );
    setMessage("");
  };

  const handleCancelTemplateEdit = () => {
    setEditingTemplateId(null);
    setEditingTemplateMuscleGroup("");
    setEditingExerciseDrafts({});
  };

  const handleSaveTemplateEdit = async (item: WorkoutTemplate) => {
    if (editingTemplateId !== item.id) {
      return;
    }

    const normalizedMuscleGroup = editingTemplateMuscleGroup.trim() || item.muscleGroup;
    if (normalizedMuscleGroup !== item.muscleGroup) {
      await updateTemplateInfo(item.id, item.name, normalizedMuscleGroup, item.assignedWeekdays);
    }

    const exercises = templateExercisesById[item.id] ?? [];
    for (const exercise of exercises) {
      const draft = editingExerciseDrafts[exercise.id];
      if (!draft) {
        continue;
      }

      const normalizedExerciseName = draft.exerciseName.trim() || exercise.exerciseName;
      const normalizedRepScheme = normalizeRepScheme(draft.repScheme);
      const normalizedWeightLabel = normalizeWeightLabel(draft.defaultWeightLabel);
      const normalizedCurrentWeightLabel = normalizeWeightLabel(exercise.defaultWeightLabel);

      const hasChanged =
        normalizedExerciseName !== exercise.exerciseName ||
        normalizedRepScheme !== exercise.repScheme ||
        normalizedWeightLabel !== normalizedCurrentWeightLabel;

      if (!hasChanged) {
        continue;
      }

      await updateTemplateExerciseById({
        exerciseId: exercise.id,
        exerciseName: normalizedExerciseName,
        repScheme: normalizedRepScheme,
        defaultWeightLabel: normalizedWeightLabel,
        imageKey: exercise.imageKey
      });
    }

    await reloadTemplateDetails(item.id);
    handleCancelTemplateEdit();
    setMessage(t("plans.templateUpdated"));
  };

  const handleMoveTemplate = async (templateId: string, direction: "up" | "down") => {
    await moveTemplate(templateId, direction);
    setMessage("");
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
        <Card style={{ ...styles.refreshCard, borderColor: colors.warning, backgroundColor: colors.surfaceAlt }}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="clock-alert-outline" size={18} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.title }]}>{t("plans.refreshTitle")}</Text>
          </View>
          <Text style={{ color: colors.textMuted, fontFamily: typography.body }}>
            {t(refreshMessageKey, { count: templatesNeedingRefresh.length, months: TEMPLATE_REFRESH_INTERVAL_MONTHS })}
          </Text>
        </Card>
      ) : null}

      <Card style={{ ...styles.newPlanCard, borderColor: colors.primarySoft }}>
        <Pressable onPress={() => setShowNewPlanCard((current) => !current)} style={styles.rowBetween}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.title }]}>{t("plans.newPlan")}</Text>
          </View>
          <MaterialCommunityIcons
            name={showNewPlanCard ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.textMuted}
          />
        </Pressable>

        {showNewPlanCard ? (
          <View style={styles.newPlanBody}>
            <Text style={[styles.label, { color: colors.text }]}>{t("plans.muscleGroup")}</Text>
            <View style={styles.row}>
              <Input placeholder={t("plans.muscleGroup")} value={muscleGroup} onChangeText={setMuscleGroup} style={styles.flex} />
              <Input
                placeholder={t("plans.sequenceNumber")}
                value={sequenceNumber}
                onChangeText={setSequenceNumber}
                style={styles.smallInput}
              />
            </View>

            <Card variant="muted" style={styles.exerciseDraftCard}>
              <Text style={[styles.miniTitle, { color: colors.text }]}>{t("plans.addExerciseToTemplate")}</Text>
              <Input placeholder={t("plans.exerciseName")} value={exerciseName} onChangeText={setExerciseName} />
              <View style={styles.row}>
                <Input placeholder={t("plans.repScheme")} value={repScheme} onChangeText={setRepScheme} style={styles.flex} />
                <Input
                  placeholder={t("plans.defaultWeightKg")}
                  value={defaultWeightLabel}
                  onChangeText={setDefaultWeightLabel}
                  style={styles.mediumInput}
                />
              </View>
              <Button
                label={t("plans.addExerciseInline")}
                variant="outline"
                onPress={addExercise}
                leftIcon={<MaterialCommunityIcons name="plus" size={16} color={colors.text} />}
              />
            </Card>

            {draftExercises.length > 0 ? (
              <View style={styles.listBlock}>
                {draftExercises.map((item, index) => (
                  <View key={`${item.exerciseName}-${index}`} style={[styles.listRow, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontFamily: typography.body }}>{item.exerciseName}</Text>
                    <Text style={{ color: colors.textMuted }}>
                      {item.repScheme} - {item.defaultWeightLabel}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Button
              label={t("plans.saveTemplate")}
              onPress={() => void handleSave()}
              style={{ ...styles.saveButton, backgroundColor: colors.primarySoft }}
              leftIcon={<MaterialCommunityIcons name="content-save-outline" size={16} color={colors.primaryStrong} />}
              variant="secondary"
            />
          </View>
        ) : null}
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
        orderedTemplates.map((item, index) => {
          const isEditing = editingTemplateId === item.id;
          const templateExercises = templateExercisesById[item.id] ?? [];

          return (
            <Card key={item.id} style={styles.planListCard}>
              <Pressable onPress={() => void handleToggleTemplateDetails(item.id)} style={styles.expandPressable} hitSlop={8}>
                <View style={styles.rowBetween}>
                  <View style={styles.flex}>
                    <Text style={[styles.planLabel, { color: colors.textMuted }]}>{t("plans.planLabel", { index: index + 1 })}</Text>
                    {isEditing ? (
                      <Input
                        value={editingTemplateMuscleGroup}
                        onChangeText={setEditingTemplateMuscleGroup}
                        placeholder={t("plans.muscleGroup")}
                        style={styles.editTemplateInput}
                      />
                    ) : (
                      <Text style={[styles.planTitle, { color: colors.text }]}>{item.muscleGroup}</Text>
                    )}
                    <View style={styles.templateMetaRow}>
                      <Text style={{ color: colors.textMuted }}>{t("plans.exerciseCount", { count: templateCounts[item.id] ?? 0 })}</Text>
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
                <Pressable
                  onPress={() => void handleMoveTemplate(item.id, "up")}
                  style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                  hitSlop={8}
                  disabled={index === 0}
                >
                  <MaterialCommunityIcons
                    name="arrow-up"
                    size={18}
                    color={index === 0 ? colors.textMuted : colors.text}
                  />
                </Pressable>
                <Pressable
                  onPress={() => void handleMoveTemplate(item.id, "down")}
                  style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                  hitSlop={8}
                  disabled={index === orderedTemplates.length - 1}
                >
                  <MaterialCommunityIcons
                    name="arrow-down"
                    size={18}
                    color={index === orderedTemplates.length - 1 ? colors.textMuted : colors.text}
                  />
                </Pressable>
                {isEditing ? (
                  <>
                    <Pressable
                      onPress={() => void handleSaveTemplateEdit(item)}
                      style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                      hitSlop={8}
                    >
                      <MaterialCommunityIcons name="content-save-outline" size={18} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      onPress={handleCancelTemplateEdit}
                      style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                      hitSlop={8}
                    >
                      <MaterialCommunityIcons name="close" size={18} color={colors.textMuted} />
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    onPress={() => void handleStartTemplateEdit(item)}
                    style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.text} />
                  </Pressable>
                )}
                <Pressable
                  onPress={() => void handleToggleTemplateActive(item.id)}
                  style={[styles.iconDangerButton, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>

              {expandedTemplateId === item.id ? (
                <View style={[styles.templateExercisesBlock, { borderColor: colors.border }]}>
                  {loadingTemplateId === item.id ? (
                    <Text style={{ color: colors.textMuted }}>{t("plans.loadingExercises")}</Text>
                  ) : templateExercises.length === 0 ? (
                    <Text style={{ color: colors.textMuted }}>{t("plans.noExercises")}</Text>
                  ) : (
                    templateExercises.map((exercise) => {
                      const exerciseDraft = editingExerciseDrafts[exercise.id];
                      const isExerciseEditing = isEditing && Boolean(exerciseDraft);

                      return (
                        <View key={exercise.id} style={[styles.exerciseRow, { borderColor: colors.border }]}>
                          {isExerciseEditing ? (
                            <View style={styles.exerciseEditWrap}>
                              <Input
                                value={exerciseDraft?.exerciseName ?? exercise.exerciseName}
                                onChangeText={(value) =>
                                  setEditingExerciseDrafts((current) => ({
                                    ...current,
                                    [exercise.id]: {
                                      exerciseName: value,
                                      repScheme: current[exercise.id]?.repScheme ?? exercise.repScheme,
                                      defaultWeightLabel:
                                        current[exercise.id]?.defaultWeightLabel ?? normalizeWeightLabel(exercise.defaultWeightLabel)
                                    }
                                  }))
                                }
                                placeholder={t("plans.exerciseName")}
                              />
                              <View style={styles.row}>
                                <Input
                                  value={exerciseDraft?.repScheme ?? exercise.repScheme}
                                  onChangeText={(value) =>
                                    setEditingExerciseDrafts((current) => ({
                                      ...current,
                                      [exercise.id]: {
                                        exerciseName: current[exercise.id]?.exerciseName ?? exercise.exerciseName,
                                        repScheme: value,
                                        defaultWeightLabel:
                                          current[exercise.id]?.defaultWeightLabel ?? normalizeWeightLabel(exercise.defaultWeightLabel)
                                      }
                                    }))
                                  }
                                  placeholder={t("plans.repScheme")}
                                  style={styles.flex}
                                />
                                <Input
                                  value={exerciseDraft?.defaultWeightLabel ?? normalizeWeightLabel(exercise.defaultWeightLabel)}
                                  onChangeText={(value) =>
                                    setEditingExerciseDrafts((current) => ({
                                      ...current,
                                      [exercise.id]: {
                                        exerciseName: current[exercise.id]?.exerciseName ?? exercise.exerciseName,
                                        repScheme: current[exercise.id]?.repScheme ?? exercise.repScheme,
                                        defaultWeightLabel: value
                                      }
                                    }))
                                  }
                                  placeholder={t("plans.defaultWeightKg")}
                                  style={styles.mediumInput}
                                />
                              </View>
                            </View>
                          ) : (
                            <View style={styles.exerciseTextWrap}>
                              <Text style={[styles.exerciseTitle, { color: colors.text }]}>{exercise.exerciseName}</Text>
                              <Text style={{ color: colors.textMuted }}>
                                {exercise.repScheme} - {normalizeWeightLabel(exercise.defaultWeightLabel)}
                              </Text>
                            </View>
                          )}
                          <View style={styles.exerciseActionWrap}>
                            <Pressable
                              onPress={() => void handleToggleExerciseActive(item.id, exercise.id)}
                              style={[styles.iconDangerButton, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                              hitSlop={8}
                            >
                              <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
                            </Pressable>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              ) : null}
            </Card>
          );
        })
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

function normalizeWeightLabel(value: string | null | undefined) {
  const normalized = (value ?? "").trim();
  return normalized.length > 0 ? normalized : "0";
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
  mediumInput: {
    width: 130
  },
  newPlanCard: {
    borderWidth: 1,
    gap: 10
  },
  newPlanBody: {
    gap: 10
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
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8
  },
  iconButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  iconDangerButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center"
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
  exerciseEditWrap: {
    gap: 8
  },
  exerciseActionWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end"
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
  },
  editTemplateInput: {
    marginTop: 4
  }
});
