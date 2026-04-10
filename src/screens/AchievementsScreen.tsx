import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "../state/AppContext";
import { useI18n } from "../i18n";
import { useTheme } from "../theme/useTheme";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";

const ACHIEVEMENTS = [
  { code: "first_checkin", i18nKey: "first", icon: "star-four-points", accent: "warning" as const },
  { code: "streak_3", i18nKey: "streak3", icon: "fire", accent: "primary" as const },
  { code: "streak_7", i18nKey: "streak7", icon: "fire-alert", accent: "primary" as const },
  { code: "streak_14", i18nKey: "streak14", icon: "lightning-bolt", accent: "primary" as const },
  { code: "streak_30", i18nKey: "streak30", icon: "crown-outline", accent: "warning" as const },
  { code: "workout_10", i18nKey: "workout10", icon: "medal-outline", accent: "purple" as const },
  { code: "workout_25", i18nKey: "workout25", icon: "weight-lifter", accent: "purple" as const },
  { code: "workout_50", i18nKey: "workout50", icon: "trophy-variant-outline", accent: "warning" as const }
] as const;

export function AchievementsScreen() {
  const { t } = useI18n();
  const { achievements } = useAppContext();
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const unlockedMap = useMemo(() => new Map(achievements.map((item) => [item.code, item])), [achievements]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top + 8, 18) }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: typography.heading }]}>{t("achievement.title")}</Text>
      {achievements.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>{t("achievement.empty")}</Text>
      ) : null}

      <View style={styles.list}>
        {ACHIEVEMENTS.map((entry) => {
          const unlocked = unlockedMap.get(entry.code);
          const iconColor =
            entry.accent === "warning"
              ? colors.warning
              : entry.accent === "purple"
                ? "#8B5CF6"
                : colors.primary;

          return (
            <Card
              key={entry.code}
              style={[
                styles.card,
                {
                  borderColor: unlocked ? colors.warning : colors.border,
                  backgroundColor: unlocked ? colors.surfaceAlt : colors.surface
                }
              ]}
            >
              <View style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: unlocked ? colors.primarySoft : colors.surfaceMuted }]}>
                  <MaterialCommunityIcons name={entry.icon as never} size={18} color={unlocked ? iconColor : colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.text, fontFamily: typography.title }]}>
                    {t(`achievement.${entry.i18nKey}.title`)}
                  </Text>
                  <Text style={{ color: colors.textMuted }}>{t(`achievement.${entry.i18nKey}.detail`)}</Text>
                </View>
                {unlocked ? <Badge label={t("achievement.unlocked")} variant="success" /> : <Badge label={t("achievement.locked")} />}
              </View>
              {unlocked ? (
                <Text style={[styles.date, { color: colors.textMuted }]}>{new Date(unlocked.unlockedAtIso).toLocaleDateString()}</Text>
              ) : null}
            </Card>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 110,
    gap: 12
  },
  title: {
    fontSize: 24,
    fontWeight: "700"
  },
  card: {
    gap: 6,
    marginBottom: 10
  },
  list: {
    gap: 10
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  name: {
    fontWeight: "600"
  },
  date: {
    fontSize: 12,
    fontWeight: "600"
  }
});
