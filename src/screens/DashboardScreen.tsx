import React, { useMemo, useState } from "react";
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { WorkoutWithExercises } from "../types";

export function DashboardScreen() {
  const { t } = useI18n();
  const { sessions, profile, achievements } = useAppContext();

  const completed = useMemo(() => sessions.filter((item) => Boolean(item.checkedInAtIso)), [sessions]);
  const chartData = useMemo(() => {
    const labels = completed.slice(-7).map((item) => item.dateIso.slice(5));
    const values = completed.slice(-7).map((item) =>
      item.exercises.reduce((acc, entry) => acc + entry.weightKg * estimateTotalReps(entry.repScheme), 0)
    );
    return { labels, datasets: [{ data: values.length ? values : [0] }] };
  }, [completed]);

  const month = useMemo(() => buildMonthGrid(new Date(), completed), [completed]);
  const [selectedDateIso, setSelectedDateIso] = useState(month.find((item) => item.completed)?.dateIso ?? month[0]?.dateIso ?? "");
  const selectedSessions = useMemo(() => completed.filter((item) => item.dateIso === selectedDateIso), [completed, selectedDateIso]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("dashboard.title")}</Text>
      <View style={styles.card}>
        <Text>
          {t("dashboard.totalCompleted")}: {completed.length}
        </Text>
        <Text>
          {t("dashboard.streak")}: {profile?.currentStreak ?? 0}
        </Text>
        <Text>
          {t("dashboard.achievements")}: {achievements.length}
        </Text>
      </View>

      <View style={styles.card}>
        {completed.length === 0 ? (
          <Text>{t("dashboard.empty")}</Text>
        ) : (
          <LineChart
            data={chartData}
            width={Dimensions.get("window").width - 56}
            height={220}
            chartConfig={{
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              color: (opacity = 1) => `rgba(255, 120, 64, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(40, 40, 40, ${opacity})`
            }}
            bezier
            style={{ borderRadius: 12 }}
          />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.calendarTitle}>{t("dashboard.calendarTitle")}</Text>
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
                {day.completed ? <Text style={styles.dayBadge}>{day.badge}</Text> : <Text style={styles.dayBadgeEmpty}>-</Text>}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.calendarTitle}>
          {t("dashboard.selectedDate")}: {selectedDateIso || "-"}
        </Text>
        {selectedSessions.length === 0 ? (
          <Text>{t("dashboard.noSessionOnDay")}</Text>
        ) : (
          selectedSessions.map((session, index) => (
            <View key={session.id} style={styles.historyCard}>
              <Text style={styles.historyTitle}>
                {t("workout.sessionLabel")} {index + 1}: {session.templateName ?? t("plans.defaultName")}
              </Text>
              <Text>{session.muscleGroup ?? t("plans.defaultMuscle")}</Text>
              {session.exercises.map((exercise) => (
                <View key={exercise.id} style={styles.historyExerciseBlock}>
                  <Text style={styles.historyExercise}>
                    {exercise.name} | {t("workout.plannedWeight")}: {exercise.plannedWeightKg}kg | {t("workout.currentWeight")}: {exercise.weightKg}kg
                  </Text>
                  <Text style={styles.historyExercise}>
                    {exercise.weightKg > exercise.plannedWeightKg ? t("dashboard.weightIncreased") : t("dashboard.weightSameOrLower")}
                  </Text>
                  {exercise.setLogs.map((setItem, setIndex) => (
                    <Text key={`${exercise.id}-${setIndex}`} style={styles.historyExercise}>
                      {t("workout.set")} {setIndex + 1}: {t("workout.targetReps")} {setItem.targetReps} | {t("workout.actualReps")} {setItem.actualReps ?? "-"} |{" "}
                      {t("workout.difficultyLabel")}: {setItem.difficulty ? t(`workout.difficulty.${setItem.difficulty}`) : "-"}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
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
    backgroundColor: "#F3F5F7",
    padding: 12,
    borderRadius: 12,
    gap: 8
  },
  calendarTitle: {
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
    gap: 2
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

function buildMonthGrid(now: Date, completedSessions: WorkoutWithExercises[]) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const completedMap = new Map<string, WorkoutWithExercises[]>();

  for (const item of completedSessions) {
    const list = completedMap.get(item.dateIso) ?? [];
    list.push(item);
    completedMap.set(item.dateIso, list);
  }

  const days: Array<{ dateIso: string; day: number; inMonth: boolean; completed: boolean; badge: string }> = [];

  for (let i = 0; i < 42; i += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dateIso = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    const sessions = completedMap.get(dateIso) ?? [];
    const badge = sessions.length > 1 ? `${sessions.length}x` : (sessions[0]?.muscleGroup ?? "").slice(0, 2).toUpperCase() || "OK";
    days.push({
      dateIso,
      day: current.getDate(),
      inMonth: current.getMonth() === month,
      completed: sessions.length > 0,
      badge
    });
  }
  return days;
}
