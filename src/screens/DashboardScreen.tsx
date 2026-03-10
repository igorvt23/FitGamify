import React, { useMemo, useState } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { WorkoutWithExercises } from "../types";

export function DashboardScreen() {
  const { t } = useI18n();
  const { sessions, profile, achievements } = useAppContext();

  const recordedSessions = useMemo(() => sessions.filter(hasRecordedData), [sessions]);
  const completedSessions = useMemo(() => recordedSessions.filter((item) => Boolean(item.checkedInAtIso)), [recordedSessions]);
  const calendarBaseDate = useMemo(() => new Date(), []);
  const month = useMemo(() => buildMonthGrid(calendarBaseDate, recordedSessions), [calendarBaseDate, recordedSessions]);
  const [selectedDateIso, setSelectedDateIso] = useState(localDateIso(new Date()));

  const selectedSessions = useMemo(() => recordedSessions.filter((item) => item.dateIso === selectedDateIso), [recordedSessions, selectedDateIso]);

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("dashboard.title")}</Text>

      <View style={styles.card}>
        <Text>
          {t("dashboard.totalRecorded")}: {recordedSessions.length}
        </Text>
        <Text>
          {t("dashboard.totalCompleted")}: {completedSessions.length}
        </Text>
        <Text>
          {t("dashboard.streak")}: {profile?.currentStreak ?? 0}
        </Text>
        <Text>
          {t("dashboard.achievements")}: {achievements.length}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("dashboard.chartTitle")}</Text>
        {recordedSessions.length === 0 ? (
          <Text>{t("dashboard.empty")}</Text>
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
              backgroundGradientFrom: "#FFF7ED",
              backgroundGradientTo: "#FFFFFF",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(234, 88, 12, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
              propsForBackgroundLines: {
                stroke: "#FDBA74",
                strokeDasharray: "4 8"
              }
            }}
            bezier
            style={{ borderRadius: 16 }}
          />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t("dashboard.calendarTitle")}</Text>
        <View style={styles.calendarWeekDays}>
          {["D", "S", "T", "Q", "Q", "S", "S"].map((item, index) => (
            <Text key={`${item}-${index}`} style={styles.weekDay}>
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
                style={[styles.dayCell, !day.inMonth && styles.dayCellMuted, isSelected && styles.dayCellSelected]}
                onPress={() => setSelectedDateIso(day.dateIso)}
              >
                <Text style={styles.dayNumber}>{day.day}</Text>
                <Text style={day.recorded ? styles.dayBadge : styles.dayBadgeEmpty}>{day.badge}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {t("dashboard.selectedDate")}: {selectedDateIso}
        </Text>
        {selectedSessions.length === 0 ? (
          <Text>{t("dashboard.noRecordedOnDay")}</Text>
        ) : (
          selectedSessions.map((session, index) => {
            const completedExercises = session.exercises.filter((item) => item.isCompleted).length;
            return (
              <View key={session.id} style={styles.historyCard}>
                <Text style={styles.historyTitle}>
                  {t("workout.sessionLabel")} {index + 1}: {session.templateName ?? t("plans.defaultName")}
                </Text>
                <Text>{session.muscleGroup ?? t("plans.defaultMuscle")}</Text>
                <Text>
                  {t("dashboard.trainingStatus")}: {session.checkedInAtIso ? t("dashboard.done") : t("dashboard.pending")}
                </Text>
                <Text>
                  {t("dashboard.completedExercises")}: {completedExercises}/{session.exercises.length}
                </Text>
                {session.exercises.map((exercise) => (
                  <View key={exercise.id} style={styles.historyExerciseBlock}>
                    <Text style={styles.historyExercise}>
                      {exercise.name} | {t("workout.currentWeight")}: {exercise.weightKg}kg | {t("dashboard.anxiety")}:{" "}
                      {exercise.anxietyLevel == null ? "-" : exercise.anxietyLevel}
                    </Text>
                    <Text style={styles.historyExercise}>
                      {exercise.weightKg > exercise.plannedWeightKg ? t("dashboard.weightIncreased") : t("dashboard.weightSameOrLower")}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </View>
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
    backgroundColor: "#F3F5F7",
    padding: 12,
    borderRadius: 12,
    gap: 8
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 16
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
  dayCellSelected: {
    backgroundColor: "#DBEAFE"
  },
  dayNumber: {
    fontSize: 12
  },
  dayBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A"
  },
  dayBadgeEmpty: {
    fontSize: 10,
    color: "#9CA3AF"
  },
  historyCard: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    gap: 4
  },
  historyTitle: {
    fontWeight: "700"
  },
  historyExercise: {
    color: "#374151"
  },
  historyExerciseBlock: {
    gap: 2,
    marginTop: 6
  }
});
