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
      item.exercises.reduce((acc, entry) => acc + entry.weightKg * entry.sets * entry.reps, 0)
    );
    return { labels, datasets: [{ data: values.length ? values : [0] }] };
  }, [completed]);

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
  }
});
