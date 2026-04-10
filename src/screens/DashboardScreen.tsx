import React, { useMemo, useState } from "react";
import { Dimensions, Image, ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { WorkoutWithExercises } from "../types";
import { useTheme } from "../theme/useTheme";
import { Card } from "../components/ui/Card";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Badge } from "../components/ui/Badge";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getOffensiveDaysToNextLevel,
  getOffensiveLevelByDays,
  getOffensiveLevelImageHrefByGoal,
  getOffensiveLevelTitle
} from "../core/offensiveLevels";
import { normalizeFitnessGoal } from "../core/fitnessGoal";
import fatLevel01Image from "../img/fat/level_01.png";
import fatLevel02Image from "../img/fat/level_02.png";
import skinnyLevel01Image from "../img/skinny/level_01.png";
import skinnyLevel02Image from "../img/skinny/level_02.png";
import inShapeLevel01Image from "../img/in_shape/level_01.png";
import inShapeLevel02Image from "../img/in_shape/level_02.png";

export function DashboardScreen() {
  const { t } = useI18n();
  const { sessions, achievements, language, profile } = useAppContext();
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const recordedSessions = useMemo(() => sessions.filter(hasRecordedData), [sessions]);
  const completedWorkoutsCount = useMemo(() => sessions.filter((item) => Boolean(item.checkedInAtIso)).length, [sessions]);
  const calendarBaseDate = useMemo(() => new Date(), []);
  const month = useMemo(() => buildMonthGrid(calendarBaseDate, recordedSessions), [calendarBaseDate, recordedSessions]);
  const [selectedDateIso, setSelectedDateIso] = useState(localDateIso(new Date()));

  const selectedSessions = useMemo(() => recordedSessions.filter((item) => item.dateIso === selectedDateIso), [recordedSessions, selectedDateIso]);
  const weekLabels = useMemo(() => {
    const translated = t("dashboard.weekdays") as unknown;
    return Array.isArray(translated) ? translated : ["S", "M", "T", "W", "T", "F", "S"];
  }, [t]);

  const groupedForChart = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of recordedSessions) {
      const current = map.get(session.dateIso) ?? 0;
      map.set(session.dateIso, current + getWorkoutVolume(session));
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7);
  }, [recordedSessions]);

  const chartData = useMemo(
    () => ({
      labels: groupedForChart.length > 0 ? groupedForChart.map(([dateIso]) => dateIso.slice(5)) : ["--"],
      datasets: [{ data: groupedForChart.length > 0 ? groupedForChart.map(([, value]) => Math.max(0, Math.round(value))) : [0] }]
    }),
    [groupedForChart]
  );

  const monthlyProgress = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    recordedSessions.forEach((session) => {
      const key = session.dateIso.slice(0, 7);
      const current = map.get(key) ?? { total: 0, count: 0 };
      const sessionWeight = session.exercises.reduce((acc, exercise) => acc + exercise.weightKg, 0);
      map.set(key, { total: current.total + sessionWeight, count: current.count + session.exercises.length });
    });

    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    const current = map.get(currentKey);
    const previous = map.get(prevKey);
    const currentAvg = current && current.count > 0 ? current.total / current.count : 0;
    const previousAvg = previous && previous.count > 0 ? previous.total / previous.count : 0;
    const delta = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : null;
    return { currentAvg, previousAvg, delta };
  }, [recordedSessions]);

  const mascotProgress = useMemo(() => Math.max(0, completedWorkoutsCount), [completedWorkoutsCount]);

  const offensiveLevel = useMemo(() => getOffensiveLevelByDays(mascotProgress), [mascotProgress]);
  const offensiveTitle = useMemo(
    () => getOffensiveLevelTitle(offensiveLevel, language),
    [language, offensiveLevel]
  );
  const offensiveDaysToNext = useMemo(
    () => getOffensiveDaysToNextLevel(mascotProgress),
    [mascotProgress]
  );
  const offensiveImageHref = useMemo(
    () => getOffensiveLevelImageHrefByGoal(offensiveLevel.level, profile?.goal),
    [offensiveLevel.level, profile?.goal]
  );
  const offensiveImageSource = useMemo(
    () => resolveOffensiveImageSource(offensiveImageHref, profile?.goal, offensiveLevel.level),
    [offensiveImageHref, offensiveLevel.level, profile?.goal]
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 8, 18) }]}
    >
      <Text style={[styles.title, { color: colors.text, fontFamily: typography.heading }]}>{t("dashboard.title")}</Text>

      <View style={styles.kpiRow}>
        <Card style={[styles.mascotHeroCard, { backgroundColor: colors.primarySoft }]}>
          {offensiveImageSource ? (
            <Image key={offensiveImageHref} source={offensiveImageSource} style={styles.mascotHeroImage} resizeMode="contain" />
          ) : (
            <View style={[styles.kpiIconWrap, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="shield-sword-outline" size={26} color={colors.primary} />
            </View>
          )}
          <Text style={[styles.mascotHeroTitle, { color: colors.text, fontFamily: typography.title }]} numberOfLines={1}>
            {offensiveTitle}
          </Text>
          <Text style={[styles.mascotHeroMeta, { color: colors.textMuted }]}>
            {t("dashboard.offensiveLevel", { level: offensiveLevel.level })}
          </Text>
          <Text style={[styles.mascotHeroMeta, { color: colors.textMuted }]}>
            {offensiveDaysToNext > 0 ? t("dashboard.nextLevelIn", { days: offensiveDaysToNext }) : t("dashboard.maxLevel")}
          </Text>
        </Card>
        <View style={styles.kpiColumn}>
          <Card style={[styles.kpiSmallCard, { backgroundColor: colors.primary }]}>
            <View style={[styles.kpiIconWrap, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
              <MaterialCommunityIcons name="fire" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.kpiSmallTextBlock}>
              <Text style={[styles.kpiValueSmall, { color: "#FFFFFF", fontFamily: typography.heading }]}>{mascotProgress}</Text>
              <Text style={[styles.offensiveDaysLabel, { color: "#FFECEC" }]}>{t("dashboard.offensiveDaysYear")}</Text>
            </View>
          </Card>
          <Card style={styles.kpiSmallCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: colors.primarySoft }]}>
              <MaterialCommunityIcons name="pulse" size={18} color={colors.primary} />
            </View>
            <View style={styles.kpiSmallTextBlock}>
              <Text style={[styles.kpiValueSmall, { color: colors.text }]}>{recordedSessions.length}</Text>
              <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{t("dashboard.totalRecordedShort")}</Text>
            </View>
          </Card>
          <Card style={styles.kpiSmallCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: colors.surfaceAlt }]}>
              <MaterialCommunityIcons name="trophy-award" size={18} color={colors.warning} />
            </View>
            <View style={styles.kpiSmallTextBlock}>
              <Text style={[styles.kpiValueSmall, { color: colors.text }]}>{achievements.length}</Text>
              <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>{t("dashboard.achievementsShort")}</Text>
            </View>
          </Card>
        </View>
      </View>

      <Card>
        <Text style={[styles.cardTitle, { color: colors.text, fontFamily: typography.title }]}>{t("dashboard.chartTitle")}</Text>
        {recordedSessions.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>{t("dashboard.empty")}</Text>
        ) : (
          <LineChart
            data={chartData}
            width={Dimensions.get("window").width - 56}
            height={220}
            withDots
            withInnerLines={false}
            withOuterLines={false}
            yAxisSuffix="kg"
            chartConfig={{
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(225, 29, 72, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(148, 148, 148, ${opacity})`,
              propsForBackgroundLines: {
                stroke: colors.border,
                strokeDasharray: "4 8"
              }
            }}
            bezier
            style={{ borderRadius: 16 }}
          />
        )}
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: colors.text, fontFamily: typography.title }]}>{t("dashboard.monthlyProgress")}</Text>
          {monthlyProgress.delta != null ? (
            <Badge
              label={`${monthlyProgress.delta >= 0 ? "+" : ""}${monthlyProgress.delta.toFixed(1)}%`}
              variant={monthlyProgress.delta >= 0 ? "success" : "warning"}
            />
          ) : null}
        </View>
        {monthlyProgress.delta == null ? (
          <Text style={{ color: colors.textMuted }}>{t("dashboard.noMonthlyData")}</Text>
        ) : (
          <>
            <Text style={{ color: colors.textMuted }}>{t("dashboard.monthlyIncrease")}</Text>
            <ProgressBar value={Math.min(1, Math.max(0, (monthlyProgress.delta + 20) / 40))} />
          </>
        )}
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: colors.text, fontFamily: typography.title }]}>{t("dashboard.calendarTitle")}</Text>
        <View style={styles.calendarWeekDays}>
          {weekLabels.map((item, index) => (
            <Text key={`${item}-${index}`} style={[styles.weekDay, { color: colors.textMuted }]}>
              {item}
            </Text>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {month.map((day, index) => {
            const isSelected = day.dateIso === selectedDateIso;
            return (
              <Pressable
                key={`${day.dateIso}-${index}`}
                style={[
                  styles.dayCell,
                  !day.inMonth && styles.dayCellMuted,
                  isSelected && { backgroundColor: colors.primarySoft }
                ]}
                onPress={() => setSelectedDateIso(day.dateIso)}
              >
                <Text style={[styles.dayNumber, { color: colors.text }]}>{day.day}</Text>
                <Text style={day.recorded ? [styles.dayBadge, { color: colors.success }] : [styles.dayBadgeEmpty, { color: colors.textMuted }]}>
                  {day.badge}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={[styles.cardTitle, { color: colors.text, fontFamily: typography.title }]}>
          {t("dashboard.selectedDate")}: {selectedDateIso}
        </Text>
        {selectedSessions.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>{t("dashboard.noRecordedOnDay")}</Text>
        ) : (
          selectedSessions.map((session, index) => {
            const completedExercises = session.exercises.filter((item) => item.isCompleted).length;
            return (
              <Card key={session.id} style={styles.historyCard} variant="muted">
                <Text style={[styles.historyTitle, { color: colors.text }]}>
                  {t("workout.sessionLabel")} {index + 1}: {session.templateName ?? t("plans.defaultName")}
                </Text>
                <Text style={{ color: colors.textMuted }}>{session.muscleGroup ?? t("plans.defaultMuscle")}</Text>
                <Text style={{ color: colors.textMuted }}>
                  {t("dashboard.trainingStatus")}: {session.checkedInAtIso ? t("dashboard.done") : t("dashboard.pending")}
                </Text>
                <Text style={{ color: colors.textMuted }}>
                  {t("dashboard.completedExercises")}: {completedExercises}/{session.exercises.length}
                </Text>
                {session.exercises.map((exercise) => (
                  <View key={exercise.id} style={styles.historyExerciseBlock}>
                    <Text style={[styles.historyExercise, { color: colors.textMuted }]}>
                      {exercise.name} | {t("workout.currentWeight")}: {exercise.weightKg}kg | {t("dashboard.anxiety")}:{" "}
                      {exercise.anxietyLevel == null ? "-" : exercise.anxietyLevel}
                    </Text>
                    <Text style={[styles.historyExercise, { color: colors.textMuted }]}>
                      {exercise.weightKg > exercise.plannedWeightKg ? t("dashboard.weightIncreased") : t("dashboard.weightSameOrLower")}
                    </Text>
                  </View>
                ))}
              </Card>
            );
          })
        )}
      </Card>
    </ScrollView>
  );
}

function hasRecordedData(session: WorkoutWithExercises) {
  return session.exercises.some(
    (exercise) =>
      exercise.isCompleted ||
      exercise.anxietyLevel != null ||
      exercise.weightKg > 0 ||
      exercise.setLogs.some((item) => item.actualReps != null || item.difficulty != null)
  );
}

function getWorkoutVolume(session: WorkoutWithExercises) {
  return session.exercises.reduce((acc, exercise) => {
    const reps = exercise.setLogs.reduce((repAcc, item) => repAcc + (item.actualReps ?? 0), 0);
    return acc + reps * exercise.weightKg;
  }, 0);
}

function buildMonthGrid(now: Date, recordedSessions: WorkoutWithExercises[]) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const recordedMap = new Map<string, WorkoutWithExercises[]>();

  for (const item of recordedSessions) {
    const list = recordedMap.get(item.dateIso) ?? [];
    list.push(item);
    recordedMap.set(item.dateIso, list);
  }

  const days: Array<{ dateIso: string; day: number; inMonth: boolean; recorded: boolean; badge: string }> = [];

  for (let i = 0; i < 42; i += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dateIso = localDateIso(current);
    const sessions = recordedMap.get(dateIso) ?? [];
    const badge = sessions.length === 0 ? "-" : sessions.length > 1 ? `${sessions.length}x` : `${sessions[0].exercises.filter((item) => item.isCompleted).length}`;
    days.push({
      dateIso,
      day: current.getDate(),
      inMonth: current.getMonth() === month,
      recorded: sessions.length > 0,
      badge
    });
  }
  return days;
}

function localDateIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const OFFENSIVE_LOCAL_IMAGE_SOURCES: Record<string, ImageSourcePropType> = {
  "../img/fat/level_01.png": fatLevel01Image,
  "../img/fat/level_02.png": fatLevel02Image,
  "../img/skinny/level_01.png": skinnyLevel01Image,
  "../img/skinny/level_02.png": skinnyLevel02Image,
  "../img/in_shape/level_01.png": inShapeLevel01Image,
  "../img/in_shape/level_02.png": inShapeLevel02Image
};

function resolveOffensiveImageSource(imageHref: string, goal?: string | null, level?: number): ImageSourcePropType | null {
  if (!imageHref) {
    return resolveOffensiveImageFallback(goal, level);
  }
  const localImage = OFFENSIVE_LOCAL_IMAGE_SOURCES[imageHref];
  if (localImage) {
    return localImage;
  }
  if (/^https?:\/\//i.test(imageHref) || imageHref.startsWith("data:image/")) {
    return { uri: imageHref };
  }
  return resolveOffensiveImageFallback(goal, level);
}

function resolveOffensiveImageFallback(goal?: string | null, level?: number): ImageSourcePropType {
  const normalizedGoal = normalizeFitnessGoal(goal);
  const normalizedLevel = (typeof level === "number" && level <= 1 ? 1 : 2) as 1 | 2;
  const fallbackByGoal = {
    lose: {
      1: fatLevel01Image,
      2: fatLevel02Image
    },
    gain: {
      1: skinnyLevel01Image,
      2: skinnyLevel02Image
    },
    maintain: {
      1: inShapeLevel01Image,
      2: inShapeLevel02Image
    }
  } as const;
  return fallbackByGoal[normalizedGoal][normalizedLevel];
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 110,
    gap: 12
  },
  title: {
    fontSize: 24,
    fontWeight: "700"
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 16
  },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch"
  },
  mascotHeroCard: {
    width: "47%",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    minHeight: 198
  },
  mascotHeroImage: {
    width: 106,
    height: 106
  },
  mascotHeroTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center"
  },
  mascotHeroMeta: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center"
  },
  kpiColumn: {
    flex: 1,
    gap: 8
  },
  kpiSmallCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    minHeight: 58,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  kpiSmallTextBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  kpiIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center"
  },
  kpiValueSmall: {
    fontSize: 20,
    fontWeight: "800"
  },
  offensiveDaysLabel: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center"
  },
  kpiLabel: {
    fontSize: 11,
    textAlign: "center"
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  calendarWeekDays: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontWeight: "600"
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  dayCell: {
    width: `${100 / 7}%`,
    paddingVertical: 8,
    alignItems: "center",
    gap: 2,
    borderRadius: 8
  },
  dayCellMuted: {
    opacity: 0.35
  },
  dayNumber: {
    fontSize: 12
  },
  dayBadge: {
    fontSize: 12,
    fontWeight: "700"
  },
  dayBadgeEmpty: {
    fontSize: 10
  },
  historyCard: {
    gap: 4
  },
  historyTitle: {
    fontWeight: "700"
  },
  historyExercise: {
    fontSize: 12
  },
  historyExerciseBlock: {
    gap: 2,
    marginTop: 6
  }
});
