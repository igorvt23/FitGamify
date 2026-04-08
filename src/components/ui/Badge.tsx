import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/useTheme";

type BadgeProps = {
  label: string;
  variant?: "success" | "warning" | "neutral";
  style?: ViewStyle;
};

export function Badge({ label, variant = "neutral", style }: BadgeProps) {
  const { colors, radius, typography } = useTheme();

  const background = variant === "success" ? "#DCFCE7" : variant === "warning" ? colors.surfaceAlt : colors.surfaceMuted;
  const textColor = variant === "success" ? "#15803D" : variant === "warning" ? colors.primaryStrong : colors.text;
  const borderColor = variant === "success" ? "#86EFAC" : variant === "warning" ? colors.primary : colors.border;

  return (
    <View style={[styles.base, { backgroundColor: background, borderRadius: radius.pill, borderColor }, style]}>
      <Text style={[styles.label, { color: textColor, fontFamily: typography.title }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: "flex-start"
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1
  }
});
