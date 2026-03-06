import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";

export function AchievementsScreen() {
  const { t } = useI18n();
  const { achievements } = useAppContext();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("achievement.title")}</Text>
      {achievements.length === 0 ? (
        <Text>{t("achievement.empty")}</Text>
      ) : (
        <FlatList
          data={achievements}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <MaterialCommunityIcons name="trophy-award" size={20} color="#e09600" />
                <Text style={styles.name}>{item.title}</Text>
              </View>
              <Text>{item.detail}</Text>
              <Text style={styles.date}>{new Date(item.unlockedAtIso).toLocaleDateString()}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    gap: 6,
    marginBottom: 8
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  name: {
    fontWeight: "600"
  },
  date: {
    fontSize: 12,
    color: "#555"
  }
});
