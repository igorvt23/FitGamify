import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { Achievement, DifficultyLevel, Exercise, ExerciseSetLog, TemplateExercise, WorkoutWithExercises } from "../types";
import { useTheme } from "../theme/useTheme";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Input } from "../components/ui/Input";
import { TEMPLATE_REFRESH_INTERVAL_MONTHS, getTemplatesNeedingRefresh } from "../core/templateRefresh";
import appLogo from "../img/logo_fitgamify.png";

const DIFFICULTIES: DifficultyLevel[] = ["easy", "medium", "hard"];
const MAX_REPS = 200;
const MAX_WEIGHT = 600;

export function WorkoutScreen() {
  const { t } = useI18n();
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    todayWorkouts,
    ensureTodayWorkout,
    createWorkoutFromTemplate,
    saveExercise,
    doCheckIn,
    templates,
    fetchTemplateExercises
  } = useAppContext();

  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [showWorkoutToggle, setShowWorkoutToggle] = useState(false);
  const [templateCounts, setTemplateCounts] = useState<Record<string, number>>({});
  const [showPlansList, setShowPlansList] = useState(false);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [templateExercisesById, setTemplateExercisesById] = useState<Record<string, TemplateExercise[]>>({});
  const plansIconAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (todayWorkouts.length === 0) {
      setSelectedWorkoutId(null);
      setShowWorkoutToggle(false);
      return;
    }
    setSelectedWorkoutId((current) => (current && todayWorkouts.some((item) => item.id === current) ? current : todayWorkouts[0].id));
  }, [todayWorkouts]);

  const activeTemplates = useMemo(() => templates.filter((item) => item.isActive), [templates]);

  useEffect(() => {
    let active = true;

    if (activeTemplates.length === 0) {
      return () => {
        active = false;
      };
    }

    const loadCounts = async () => {
      const entries = await Promise.all(
        activeTemplates.map(async (item) => {
          const exercises = await fetchTemplateExercises(item.id);
          return [item.id, exercises.length] as const;
        })
      );
      if (active) {
        setTemplateCounts(Object.fromEntries(entries));
      }
    };

    void loadCounts();

    return () => {
      active = false;
    };
  }, [activeTemplates, fetchTemplateExercises]);

  useEffect(() => {
    Animated.timing(plansIconAnim, {
      toValue: showPlansList ? 1 : 0,
      duration: 180,
      useNativeDriver: true
    }).start();
  }, [plansIconAnim, showPlansList]);

  const selectedWorkout = useMemo(
    () => todayWorkouts.find((item) => item.id === selectedWorkoutId) ?? todayWorkouts[0] ?? null,
    [selectedWorkoutId, todayWorkouts]
  );
  const todayTemplateIds = useMemo(
    () => new Set(todayWorkouts.map((item) => item.templateId).filter((item): item is string => Boolean(item))),
    [todayWorkouts]
  );
  const remainingTemplatesToday = useMemo(
    () => activeTemplates.filter((item) => !todayTemplateIds.has(item.id)),
    [activeTemplates, todayTemplateIds]
  );
  const templatesNeedingRefresh = useMemo(() => getTemplatesNeedingRefresh(activeTemplates), [activeTemplates]);
  const refreshMessageKey = templatesNeedingRefresh.length === 1 ? "workout.refreshBodySingle" : "workout.refreshBodyPlural";
  const plansIconRotate = useMemo(
    () =>
      plansIconAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "90deg"]
      }),
    [plansIconAnim]
  );

  const handleToggleTemplateDetails = async (templateId: string) => {
    setExpandedTemplateId((current) => (current === templateId ? null : templateId));

    if (templateExercisesById[templateId] || loadingTemplateId === templateId) {
      return;
    }

    setLoadingTemplateId(templateId);
    try {
      const exercises = await fetchTemplateExercises(templateId);
      setTemplateExercisesById((current) => ({ ...current, [templateId]: exercises }));
    } finally {
      setLoadingTemplateId((current) => (current === templateId ? null : current));
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 8, 18) }]}
    >
      <View style={styles.brandHeader}>
        <Image source={appLogo} style={styles.brandLogo} resizeMode="contain" />
        <Text style={[styles.brandTitle, { color: colors.text, fontFamily: typography.heading }]}>FitGamify</Text>
      </View>

      {templatesNeedingRefresh.length > 0 ? (
        <Card style={[styles.refreshCard, { borderColor: colors.warning, backgroundColor: colors.surfaceAlt }]}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="clock-alert-outline" size={18} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.title }]}>{t("workout.refreshTitle")}</Text>
          </View>
          <Text style={{ color: colors.textMuted, fontFamily: typography.body }}>
            {t(refreshMessageKey, { count: templatesNeedingRefresh.length, months: TEMPLATE_REFRESH_INTERVAL_MONTHS })}
          </Text>
        </Card>
      ) : null}

      {todayWorkouts.length === 0 ? (
        <View style={styles.emptyStateWrap}>
          <View style={[styles.heroIconWrap, { backgroundColor: colors.surface, borderColor: colors.primaryShadow }]}>
            <Image source={appLogo} style={styles.heroLogo} resizeMode="contain" />
          </View>

          <Text style={[styles.homeTitle, { color: colors.text, fontFamily: typography.heading }]}>{t("workout.emptyTitle")}</Text>
          <Text style={[styles.homeSubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>{t("workout.emptySubtitle")}</Text>

          <Pressable onPress={() => setShowPlansList((current) => !current)} style={styles.sectionHeadButton}>
            <Animated.View style={{ transform: [{ rotate: plansIconRotate }] }}>
              <MaterialCommunityIcons name="play-outline" size={16} color={colors.primary} />
            </Animated.View>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.title }]}>{t("workout.yourPlans")}</Text>
          </Pressable>

          {activeTemplates.length === 0 ? (
            <Card style={styles.planCard}>
              <Text style={{ color: colors.textMuted }}>{t("workout.noTemplates")}</Text>
              <Button label={t("workout.create")} onPress={() => void ensureTodayWorkout()} />
            </Card>
          ) : !showPlansList ? null : (
            <View style={styles.planList}>
              {activeTemplates.map((item, index) => {
                const isExpanded = expandedTemplateId === item.id;
                const templateExercises = templateExercisesById[item.id] ?? [];
                const isLoadingExercises = loadingTemplateId === item.id;

                return (
                  <Card key={item.id} style={styles.planCard}>
                    <View style={styles.rowBetween}>
                      <Pressable onPress={() => void handleToggleTemplateDetails(item.id)} style={styles.planInfoPressable}>
                        <View style={styles.row}>
                          <View style={[styles.badgeCircle, { backgroundColor: "#1F2A44" }]}>
                            <Text style={[styles.badgeCircleText, { fontFamily: typography.body }]}>{String.fromCharCode(65 + index)}</Text>
                          </View>
                          <View>
                            <Text style={[styles.planTitle, { color: colors.text, fontFamily: typography.title }]}>{item.muscleGroup}</Text>
                            <Text style={{ color: colors.textMuted, fontFamily: typography.body }}>
                              {t("workout.exerciseCount", { count: templateCounts[item.id] ?? 0 })}
                            </Text>
                            <View style={styles.planToggleRow}>
                              <MaterialCommunityIcons
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={14}
                                color={colors.textMuted}
                              />
                              <Text style={[styles.planToggleText, { color: colors.textMuted, fontFamily: typography.body }]}>
                                {isExpanded ? t("workout.hideExercises") : t("workout.showExercises")}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </Pressable>

                      <Button
                        label={t("workout.startNow")}
                        size="sm"
                        onPress={() => void createWorkoutFromTemplate(item.id)}
                        style={styles.startSmallButton}
                      />
                    </View>

                    {isExpanded ? (
                      <View style={[styles.templateExerciseList, { borderColor: colors.border }]}>
                        {isLoadingExercises ? (
                          <Text style={{ color: colors.textMuted, fontFamily: typography.body }}>Carregando exercicios...</Text>
                        ) : templateExercises.length === 0 ? (
                          <Text style={{ color: colors.textMuted, fontFamily: typography.body }}>{t("plans.noExercises")}</Text>
                        ) : (
                          templateExercises.map((exercise, exerciseIndex) => (
                            <View key={exercise.id} style={styles.templateExerciseRow}>
                              <Text style={[styles.templateExerciseName, { color: colors.text, fontFamily: typography.body }]}>
                                {exerciseIndex + 1}. {exercise.exerciseName}
                              </Text>
                              <Text style={[styles.templateExerciseMeta, { color: colors.textMuted, fontFamily: typography.body }]}>
                                {exercise.repScheme} - {exercise.defaultWeightKg}kg
                              </Text>
                            </View>
                          ))
                        )}
                      </View>
                    ) : null}
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.activeWrap}>
          {todayWorkouts.length > 1 ? (
            <View style={styles.workoutToggleWrap}>
              <Pressable
                onPress={() => setShowWorkoutToggle((prev) => !prev)}
                style={[styles.workoutToggleButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <View style={styles.row}>
                  <MaterialCommunityIcons name="calendar-check-outline" size={16} color={colors.primary} />
                  <Text style={[styles.workoutToggleText, { color: colors.text, fontFamily: typography.body }]}>
                    {t("workout.todayWorkout")}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={showWorkoutToggle ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              {showWorkoutToggle ? (
                <View style={styles.workoutToggleList}>
                  {todayWorkouts.map((workout, index) => {
                    const selected = workout.id === selectedWorkout?.id;
                    const title = workout.muscleGroup ?? workout.templateName ?? t("plans.defaultName");
                    return (
                      <Pressable
                        key={workout.id}
                        onPress={() => {
                          setSelectedWorkoutId(workout.id);
                          setShowWorkoutToggle(false);
                        }}
                        style={[
                          styles.workoutToggleItem,
                          {
                            borderColor: selected ? colors.primary : colors.border,
                            backgroundColor: selected ? colors.primarySoft : colors.surface
                          }
                        ]}
                      >
                        <Text style={{ color: selected ? colors.primaryStrong : colors.text, fontFamily: typography.body }}>
                          #{index + 1} {title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          ) : null}

          {selectedWorkout ? (
            <WorkoutSessionCard workout={selectedWorkout} t={t} onSaveExercise={saveExercise} onCheckIn={doCheckIn} />
          ) : null}

          <Card style={styles.addAnotherCard}>
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <MaterialCommunityIcons name="plus-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: typography.title }]}>{t("workout.addAnother")}</Text>
              </View>
            </View>

            {remainingTemplatesToday.length === 0 ? (
              <Text style={{ color: colors.textMuted, fontFamily: typography.body }}>{t("workout.noMoreTemplatesToday")}</Text>
            ) : (
              <View style={styles.inlineTemplateList}>
                {remainingTemplatesToday.map((item, index) => (
                  <View
                    key={item.id}
                    style={[styles.inlineTemplateItem, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
                  >
                    <View style={styles.row}>
                      <View style={[styles.badgeCircle, { backgroundColor: "#1F2A44" }]}>
                        <Text style={[styles.badgeCircleText, { fontFamily: typography.body }]}>{String.fromCharCode(65 + index)}</Text>
                      </View>
                      <View>
                        <Text style={[styles.planTitle, { color: colors.text, fontFamily: typography.title }]}>{item.muscleGroup}</Text>
                        <Text style={{ color: colors.textMuted, fontFamily: typography.body }}>
                          {t("workout.exerciseCount", { count: templateCounts[item.id] ?? 0 })}
                        </Text>
                      </View>
                    </View>
                    <Button label={t("workout.startNow")} size="sm" onPress={() => void createWorkoutFromTemplate(item.id)} />
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

function WorkoutSessionCard({
  workout,
  t,
  onSaveExercise,
  onCheckIn
}: {
  workout: WorkoutWithExercises;
  t: (key: string, options?: Record<string, unknown>) => string;
  onSaveExercise: (params: { exerciseId: string; weightKg: number; setLogs: ExerciseSetLog[]; anxietyLevel: number | null; isCompleted: boolean }) => Promise<void>;
  onCheckIn: (translate: (key: string) => string, sessionId?: string, intensity?: number | null) => Promise<Achievement[]>;
}) {
  const { colors, typography, isDark } = useTheme();
  const [queueIds, setQueueIds] = useState<string[]>([]);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [effortValue, setEffortValue] = useState(5);
  const [finalizing, setFinalizing] = useState(false);
  const [pendingUnlocks, setPendingUnlocks] = useState<Achievement[]>([]);
  const [unlockTotalCount, setUnlockTotalCount] = useState(0);
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const unlockCardAnim = useRef(new Animated.Value(0)).current;

  const exerciseKey = useMemo(() => workout.exercises.map((item) => item.id).join("|"), [workout.exercises]);
  const exerciseMap = useMemo(() => new Map(workout.exercises.map((item) => [item.id, item])), [workout.exercises]);

  useEffect(() => {
    const ids = workout.exercises.map((item) => item.id);
    setQueueIds((prev) => {
      if (prev.length === 0) {
        return ids;
      }
      const next = prev.filter((id) => ids.includes(id));
      const missing = ids.filter((id) => !next.includes(id));
      return [...next, ...missing];
    });
  }, [exerciseKey, workout.exercises]);

  useEffect(() => {
    if (!workout.exercises.length) {
      setActiveExerciseId(null);
      return;
    }

    if (!activeExerciseId || !workout.exercises.some((item) => item.id === activeExerciseId)) {
      const firstIncomplete = workout.exercises.find((item) => !item.isCompleted) ?? workout.exercises[0];
      setActiveExerciseId(firstIncomplete.id);
    }
  }, [activeExerciseId, workout.exercises]);

  useEffect(() => {
    setFinalizeOpen(false);
    setEffortValue(5);
    setPendingUnlocks([]);
    setUnlockTotalCount(0);
    setUnlockModalVisible(false);
  }, [workout.id]);

  useEffect(() => {
    if (!unlockModalVisible || pendingUnlocks.length === 0) {
      return;
    }
    unlockCardAnim.setValue(0);
    Animated.spring(unlockCardAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 15,
      bounciness: 10
    }).start();
  }, [pendingUnlocks.length, unlockCardAnim, unlockModalVisible]);

  const orderedExercises = useMemo(
    () => queueIds.map((id) => exerciseMap.get(id)).filter((item): item is Exercise => Boolean(item)),
    [exerciseMap, queueIds]
  );

  const activeExercise = orderedExercises.find((item) => item.id === activeExerciseId) ?? null;
  const completedCount = workout.exercises.filter((item) => item.isCompleted).length;
  const progress = workout.exercises.length === 0 ? 0 : completedCount / workout.exercises.length;
  const canCheckIn = workout.exercises.length > 0 && workout.exercises.every((item) => item.isCompleted);
  const showDoneState = canCheckIn || Boolean(workout.checkedInAtIso);
  const activeUnlock = pendingUnlocks[0] ?? null;
  const unlockScale = unlockCardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1]
  });
  const unlockOpacity = unlockCardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const handleSkipExercise = () => {
    if (!activeExercise) {
      return;
    }

    const nextQueue = [...queueIds.filter((id) => id !== activeExercise.id), activeExercise.id];
    setQueueIds(nextQueue);

    const nextId = nextQueue.find((id) => id !== activeExercise.id && !exerciseMap.get(id)?.isCompleted) ?? nextQueue[0] ?? null;
    setActiveExerciseId(nextId);
  };

  const moveToNextExercise = (skipId?: string) => {
    if (!activeExercise) {
      return;
    }

    const currentIndex = queueIds.indexOf(activeExercise.id);
    const forward = queueIds.slice(currentIndex + 1);
    const backward = queueIds.slice(0, currentIndex + 1);
    const nextId = [...forward, ...backward].find((id) => id !== skipId && !exerciseMap.get(id)?.isCompleted);

    if (nextId) {
      setActiveExerciseId(nextId);
    }
  };

  const handleFinalize = async () => {
    if (finalizing || workout.checkedInAtIso) {
      return;
    }

    setFinalizing(true);
    try {
      const unlockedNow = await onCheckIn(t, workout.id, effortValue);
      setFinalizeOpen(false);
      if (unlockedNow.length > 0) {
        setPendingUnlocks(unlockedNow);
        setUnlockTotalCount(unlockedNow.length);
        setUnlockModalVisible(true);
      }
    } finally {
      setFinalizing(false);
    }
  };

  const handleUnlockAchievement = () => {
    if (pendingUnlocks.length <= 1) {
      setPendingUnlocks([]);
      setUnlockTotalCount(0);
      setUnlockModalVisible(false);
      return;
    }
    setPendingUnlocks((current) => current.slice(1));
  };

  const workoutName = workout.muscleGroup ?? workout.templateName ?? t("plans.defaultName");
  const badgeBg = isDark ? colors.surfaceMuted : "#1F2A44";

  return (
    <View style={styles.sessionWrap}>
      <View style={styles.rowBetween}>
        <Text style={[styles.sessionTitle, { color: colors.text, fontFamily: typography.heading }]}>{workoutName}</Text>
        <View style={[styles.countBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.countBadgeText, { fontFamily: typography.body }]}>
            {completedCount}/{workout.exercises.length}
          </Text>
        </View>
      </View>

      <ProgressBar value={progress} style={[styles.progressBar, { backgroundColor: colors.border }]} />

      {showDoneState ? (
        <Card style={[styles.successCard, { borderColor: "#9AE6B4", backgroundColor: "#EAF7EE" }]}
        >
          <View style={styles.successIconWrap}>
            <MaterialCommunityIcons name="check-circle-outline" size={36} color="#09B44D" />
          </View>
          <Text style={[styles.successTitle, { fontFamily: typography.heading }]}>{t("workout.workoutDoneTitle")}</Text>
          <Text style={[styles.successSubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>{t("workout.workoutDoneSubtitle")}</Text>

          {!workout.checkedInAtIso ? (
            <Pressable onPress={() => setFinalizeOpen(true)} style={styles.finishButton}>
              <MaterialCommunityIcons name="trophy-outline" size={18} color="#FFFFFF" />
              <Text style={[styles.finishButtonText, { fontFamily: typography.title }]}>{t("workout.finishWorkout")}</Text>
            </Pressable>
          ) : null}
        </Card>
      ) : activeExercise ? (
        <ExerciseExecutionCard
          exercise={activeExercise}
          t={t}
          onSaveExercise={onSaveExercise}
          onSkipExercise={handleSkipExercise}
          onCompleteExercise={moveToNextExercise}
        />
      ) : (
        <Card>
          <Text style={{ color: colors.textMuted }}>{t("workout.noExercisesInWorkout")}</Text>
        </Card>
      )}

      <Modal visible={finalizeOpen} transparent animationType="fade" onRequestClose={() => setFinalizeOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: colors.primarySoft, borderColor: colors.primaryShadow }]}>
              <MaterialCommunityIcons name="trophy-outline" size={28} color={colors.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: typography.heading }]}>{t("workout.effortTitle")}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>{t("workout.effortQuestion")}</Text>

            <Text style={[styles.modalValue, { color: colors.primary, fontFamily: typography.heading }]}>{effortValue}<Text style={[styles.modalOutOf, { color: colors.textMuted }]}>/10</Text></Text>

            <Slider
              style={{ width: "100%" }}
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={effortValue}
              onValueChange={(value) => setEffortValue(Math.round(value))}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />

            <View style={styles.modalActions}>
              <Pressable onPress={() => setFinalizeOpen(false)} style={[styles.modalButton, styles.modalCancel]}>
                <Text style={[styles.modalCancelText, { fontFamily: typography.title }]}>{t("workout.cancel")}</Text>
              </Pressable>

              <Pressable onPress={() => void handleFinalize()} disabled={finalizing} style={[styles.modalButton, styles.modalConfirm, finalizing ? { opacity: 0.65 } : null]}>
                <Text style={[styles.modalConfirmText, { fontFamily: typography.title }]}>{t("workout.confirm")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={unlockModalVisible && Boolean(activeUnlock)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPendingUnlocks([]);
          setUnlockTotalCount(0);
          setUnlockModalVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.unlockCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.primaryShadow,
                opacity: unlockOpacity,
                transform: [{ scale: unlockScale }]
              }
            ]}
          >
            <View style={[styles.unlockIconWrap, { backgroundColor: colors.primarySoft, borderColor: colors.primaryShadow }]}>
              <MaterialCommunityIcons
                name={activeUnlock ? getAchievementUnlockIcon(activeUnlock.code) : "trophy-award"}
                size={32}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: typography.heading }]}>{t("workout.unlockModalTitle")}</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted, fontFamily: typography.body }]}>{activeUnlock?.title}</Text>
            <Text style={[styles.unlockDetail, { color: colors.textMuted, fontFamily: typography.body }]}>{activeUnlock?.detail}</Text>
            <Text style={[styles.unlockProgress, { color: colors.primary, fontFamily: typography.body }]}>
              {t("workout.unlockProgress", {
                current: Math.max(1, unlockTotalCount - pendingUnlocks.length + 1),
                total: Math.max(1, unlockTotalCount)
              })}
            </Text>
            <Pressable onPress={handleUnlockAchievement} style={styles.unlockActionButton}>
              <MaterialCommunityIcons name="lock-open-variant-outline" size={18} color="#FFFFFF" />
              <Text style={[styles.unlockActionText, { fontFamily: typography.title }]}>{t("workout.unlockAction")}</Text>
            </Pressable>
            <Text style={[styles.unlockHint, { color: colors.textMuted, fontFamily: typography.body }]}>{t("workout.unlockModalHint")}</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function ExerciseExecutionCard({
  exercise,
  t,
  onSaveExercise,
  onSkipExercise,
  onCompleteExercise
}: {
  exercise: Exercise;
  t: (key: string, options?: Record<string, unknown>) => string;
  onSaveExercise: (params: { exerciseId: string; weightKg: number; setLogs: ExerciseSetLog[]; anxietyLevel: number | null; isCompleted: boolean }) => Promise<void>;
  onSkipExercise: () => void;
  onCompleteExercise: (exerciseId: string) => void;
}) {
  const { colors, typography, isDark } = useTheme();
  const [setLogs, setSetLogs] = useState<ExerciseSetLog[]>([]);
  const [currentWeight, setCurrentWeight] = useState("");
  const [currentReps, setCurrentReps] = useState("");
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>("medium");
  const [saving, setSaving] = useState(false);
  const [activeSetIndex, setActiveSetIndex] = useState(0);

  useEffect(() => {
    setSetLogs(exercise.setLogs.map((item) => ({ ...item })));
    setCurrentWeight("");
    setCurrentReps("");
    setCurrentDifficulty("medium");
    setActiveSetIndex(findFirstIncomplete(exercise.setLogs));
  }, [exercise.id, exercise.setLogs]);

  const activeSet = setLogs[activeSetIndex];
  const totalSets = setLogs.length;
  const headerBg = isDark ? "#1A2740" : "#1F2A44";
  const hasReps = isNumericEntry(currentReps);
  const hasWeight = isNumericEntry(currentWeight, true);
  const canConfirmSeries = Boolean(activeSet) && !saving && hasReps && hasWeight;

  const handleConfirmSet = async () => {
    if (!canConfirmSeries || !activeSet) {
      return;
    }

    const repsValue = normalizeIntegerFieldValue(currentReps, activeSet.targetReps, MAX_REPS);
    const fallbackWeight = exercise.weightKg || exercise.plannedWeightKg || 0;
    const weightValue = normalizeWeightFieldValue(currentWeight, fallbackWeight, MAX_WEIGHT);

    const nextLogs = setLogs.map((item, index) =>
      index === activeSetIndex
        ? {
            ...item,
            actualReps: repsValue,
            difficulty: currentDifficulty
          }
        : item
    );

    const allSetsDone = nextLogs.every((item) => item.actualReps != null);

    setSaving(true);
    try {
      await onSaveExercise({
        exerciseId: exercise.id,
        weightKg: weightValue,
        setLogs: nextLogs,
        anxietyLevel: exercise.anxietyLevel,
        isCompleted: allSetsDone
      });

      setSetLogs(nextLogs);
      setCurrentReps("");
      setCurrentWeight("");
      setCurrentDifficulty("medium");

      if (allSetsDone) {
        onCompleteExercise(exercise.id);
      } else {
        setActiveSetIndex(findFirstIncomplete(nextLogs));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.exerciseCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={[styles.exerciseHeader, { backgroundColor: headerBg }]}>
        <Text style={[styles.seriesPill, { fontFamily: typography.body }]}>{t("workout.seriesOf", { current: activeSetIndex + 1, total: Math.max(1, totalSets) })}</Text>
        <Text style={[styles.exerciseName, { fontFamily: typography.heading }]}>{exercise.name}</Text>
        <Text style={[styles.exerciseMeta, { fontFamily: typography.body }]}>{t("workout.goalLine", { scheme: exercise.repScheme, weight: exercise.plannedWeightKg })}</Text>
      </View>

      <View style={styles.exerciseBody}>
        <View style={styles.inputRow}>
          <View style={styles.inputBlock}>
            <Text style={[styles.inputLabel, { color: colors.text, fontFamily: typography.body }]}>{t("workout.repsLabel")}</Text>
            <Input
              keyboardType="numeric"
              value={currentReps}
              onChangeText={setCurrentReps}
              placeholder={t("workout.repsPlaceholder", { value: activeSet?.targetReps ?? 10 })}
              style={[styles.inputField, { color: colors.text, fontFamily: typography.body }]}
            />
          </View>

          <View style={styles.inputBlock}>
            <Text style={[styles.inputLabel, { color: colors.text, fontFamily: typography.body }]}>{t("workout.weightLabel")}</Text>
            <Input
              keyboardType="decimal-pad"
              value={currentWeight}
              onChangeText={setCurrentWeight}
              placeholder={t("workout.weightPlaceholder", { value: exercise.plannedWeightKg || 0 })}
              style={[styles.inputField, { color: colors.text, fontFamily: typography.body }]}
            />
          </View>
        </View>

        <Text style={[styles.inputLabel, { color: colors.text, fontFamily: typography.body }]}>{t("workout.effortLabel")}</Text>

        <View style={styles.difficultyRow}>
          {DIFFICULTIES.map((difficulty) => {
            const selected = currentDifficulty === difficulty;
            return (
              <Pressable
                key={difficulty}
                onPress={() => setCurrentDifficulty(difficulty)}
                style={[
                  styles.difficultyButton,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: colors.surface
                  }
                ]}
              >
                <Text style={[styles.difficultyText, { color: selected ? colors.primary : colors.textMuted, fontFamily: typography.body }]}>
                  {t(`workout.difficulty.${difficulty}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => void handleConfirmSet()}
          disabled={!canConfirmSeries}
          style={[
            styles.confirmSeriesButton,
            canConfirmSeries ? styles.confirmSeriesButtonEnabled : styles.confirmSeriesButtonDisabled
          ]}
        >
          <MaterialCommunityIcons name="check-circle-outline" size={19} color="#FFFFFF" />
          <Text style={[styles.confirmSeriesText, { fontFamily: typography.title }]}>{t("workout.confirmSet")}</Text>
        </Pressable>

        <Pressable onPress={onSkipExercise} style={styles.skipExerciseRow}>
          <MaterialCommunityIcons name="skip-next" size={15} color={colors.textMuted} />
          <Text style={[styles.skipExerciseText, { color: colors.textMuted, fontFamily: typography.body }]}>{t("workout.skipExercise")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function findFirstIncomplete(setLogs: ExerciseSetLog[]) {
  const index = setLogs.findIndex((item) => item.actualReps == null);
  return index >= 0 ? index : Math.max(0, setLogs.length - 1);
}

function normalizeIntegerFieldValue(raw: string, fallback: number, max: number) {
  if (raw.trim() === "") {
    return Math.max(0, Math.min(max, Math.round(fallback)));
  }
  const parsed = Number(raw.trim());
  if (!Number.isFinite(parsed)) {
    return Math.max(0, Math.min(max, Math.round(fallback)));
  }
  return Math.max(0, Math.min(max, Math.round(parsed)));
}

function normalizeWeightFieldValue(raw: string, fallback: number, max: number) {
  const parsed = parseLocaleNumber(raw);
  if (parsed == null) {
    return Math.max(0, Math.min(max, Math.round(fallback * 100) / 100));
  }
  return Math.max(0, Math.min(max, Math.round(parsed * 100) / 100));
}

function isNumericEntry(value: string, allowDecimal = false) {
  if (value.trim() === "") {
    return false;
  }
  const parsed = allowDecimal ? parseLocaleNumber(value) : Number(value.trim());
  if (parsed == null) {
    return false;
  }
  return Number.isFinite(parsed) && parsed >= 0;
}

function parseLocaleNumber(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function getAchievementUnlockIcon(code: Achievement["code"]) {
  if (code === "first_checkin") {
    return "star-four-points";
  }
  if (code === "streak_3" || code === "streak_7") {
    return "fire";
  }
  if (code === "streak_14") {
    return "lightning-bolt";
  }
  if (code === "streak_30") {
    return "crown-outline";
  }
  if (code === "workout_10") {
    return "medal-outline";
  }
  if (code === "workout_25") {
    return "weight-lifter";
  }
  if (code === "workout_50") {
    return "trophy-variant-outline";
  }
  return "trophy-award";
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 110,
    gap: 12
  },
  emptyStateWrap: {
    gap: 10
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  brandLogo: {
    width: 36,
    height: 36
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "900"
  },
  heroIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 24,
    borderWidth: 2,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center"
  },
  heroLogo: {
    width: 58,
    height: 58
  },
  homeTitle: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 30
  },
  homeSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 320,
    alignSelf: "center"
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6
  },
  sectionHeadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800"
  },
  refreshCard: {
    borderWidth: 1
  },
  planList: {
    gap: 10
  },
  planCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 16,
    shadowOpacity: 0.05
  },
  planInfoPressable: {
    flex: 1
  },
  planToggleRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  planToggleText: {
    fontSize: 11,
    fontWeight: "700"
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  badgeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  badgeCircleText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800"
  },
  planTitle: {
    fontSize: 16,
    fontWeight: "800"
  },
  startSmallButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9
  },
  templateExerciseList: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8
  },
  templateExerciseRow: {
    gap: 2
  },
  templateExerciseName: {
    fontSize: 13,
    fontWeight: "700"
  },
  templateExerciseMeta: {
    fontSize: 12
  },
  activeWrap: {
    gap: 12
  },
  addAnotherCard: {
    gap: 10
  },
  inlineTemplateList: {
    gap: 8
  },
  inlineTemplateItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  workoutToggleWrap: {
    gap: 8
  },
  workoutToggleButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  workoutToggleText: {
    fontSize: 13,
    fontWeight: "700"
  },
  workoutToggleList: {
    gap: 6
  },
  workoutToggleItem: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  sessionWrap: {
    gap: 10
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: "800"
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999
  },
  countBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800"
  },
  progressBar: {
    height: 14,
    borderRadius: 999
  },
  exerciseCard: {
    borderWidth: 1,
    borderRadius: 28,
    overflow: "hidden"
  },
  exerciseHeader: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
    alignItems: "center",
    gap: 6
  },
  seriesPill: {
    backgroundColor: "#314A6F",
    color: "#DDE5F5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    letterSpacing: 0.5,
    fontWeight: "700"
  },
  exerciseName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900"
  },
  exerciseMeta: {
    color: "#9FB3D4",
    fontSize: 12,
    letterSpacing: 0.7,
    fontWeight: "800"
  },
  exerciseBody: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12
  },
  inputRow: {
    flexDirection: "row",
    gap: 12
  },
  inputBlock: {
    flex: 1,
    gap: 6
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700"
  },
  inputField: {
    textAlign: "center",
    fontSize: 18,
    paddingVertical: 12
  },
  difficultyRow: {
    flexDirection: "row",
    gap: 10
  },
  difficultyButton: {
    flex: 1,
    borderWidth: 3,
    borderRadius: 15,
    paddingVertical: 10,
    alignItems: "center"
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: "700"
  },
  confirmSeriesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 15,
    paddingVertical: 14
  },
  confirmSeriesButtonEnabled: {
    backgroundColor: "#FF2D2D"
  },
  confirmSeriesButtonDisabled: {
    backgroundColor: "#BFC7D4"
  },
  confirmSeriesText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800"
  },
  skipExerciseRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    paddingTop: 2,
    paddingBottom: 4
  },
  skipExerciseText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase"
  },
  successCard: {
    borderWidth: 2,
    borderRadius: 26,
    alignItems: "center",
    paddingVertical: 26,
    paddingHorizontal: 16,
    gap: 12
  },
  successIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CFF5DB",
    borderWidth: 2,
    borderColor: "#99E6B8"
  },
  successTitle: {
    color: "#038A37",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center"
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 20
  },
  finishButton: {
    width: "100%",
    maxWidth: 300,
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: "#08C74E",
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#0A943D"
  },
  finishButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    paddingHorizontal: 18
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: "center",
    gap: 10
  },
  unlockCard: {
    borderWidth: 2,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: "center",
    gap: 10
  },
  modalIconWrap: {
    width: 82,
    height: 82,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2
  },
  unlockIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 250
  },
  modalValue: {
    fontSize: 52,
    fontWeight: "900"
  },
  modalOutOf: {
    fontSize: 36,
    fontWeight: "800"
  },
  unlockDetail: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280
  },
  unlockProgress: {
    fontSize: 13,
    fontWeight: "700"
  },
  unlockActionButton: {
    width: "100%",
    marginTop: 4,
    borderRadius: 14,
    backgroundColor: "#FF2D2D",
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#C71827"
  },
  unlockActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800"
  },
  unlockHint: {
    fontSize: 12,
    textAlign: "center"
  },
  modalActions: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
    marginTop: 8
  },
  modalButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 3
  },
  modalCancel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#C2CEDD"
  },
  modalCancelText: {
    color: "#1F2A44",
    fontSize: 15,
    fontWeight: "800"
  },
  modalConfirm: {
    backgroundColor: "#FF2D2D",
    borderColor: "#C71827"
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800"
  }
});
