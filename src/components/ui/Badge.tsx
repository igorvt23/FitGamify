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

  const background =
    variant === "success" ? colors.success : variant === "warning" ? colors.warning : colors.surfaceMuted;
  const textColor = variant === "neutral" ? colors.text : "#FFFFFF";

  return (
    <View style={[styles.base, { backgroundColor: background, borderRadius: radius.pill }, style]}>
      <Text style={[styles.label, { color: textColor, fontFamily: typography.body }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start"
  },
  label: {
    fontSize: 11,
    fontWeight: "700"
  }
});
