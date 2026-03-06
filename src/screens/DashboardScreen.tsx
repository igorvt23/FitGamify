import React, { useMemo } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";

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
          {month.map((day, index) => (
            <View key={`${day.dateIso}-${index}`} style={[styles.dayCell, !day.inMonth && styles.dayCellMuted]}>
              <Text style={styles.dayNumber}>{day.day}</Text>
              {day.completed ? (
                <Text style={styles.dayBadge}>{day.muscleShort ? day.muscleShort : "✓"}</Text>
              ) : (
                <Text style={styles.dayBadgeEmpty}>-</Text>
              )}
            </View>
          ))}
        </View>
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
    paddingVertical: 6,
    alignItems: "center",
    gap: 2
  },
  dayCellMuted: {
    opacity: 0.35
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

function buildMonthGrid(now: Date, completedSessions: Array<{ dateIso: string; muscleGroup: string | null }>) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());

  const completedMap = new Map(completedSessions.map((item) => [item.dateIso, item.muscleGroup ?? ""]));
  const days: Array<{ dateIso: string; day: number; inMonth: boolean; completed: boolean; muscleShort: string }> = [];

  for (let i = 0; i < 42; i += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dateIso = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    const muscle = completedMap.get(dateIso) ?? "";
    days.push({
      dateIso,
      day: current.getDate(),
      inMonth: current.getMonth() === month,
      completed: completedMap.has(dateIso),
      muscleShort: muscle.slice(0, 2).toUpperCase()
    });
  }
  return days;
}
