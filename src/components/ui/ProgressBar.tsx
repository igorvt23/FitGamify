import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/useTheme";

type ProgressBarProps = {
  value: number;
  style?: ViewStyle;
};

export function ProgressBar({ value, style }: ProgressBarProps) {
  const { colors, radius } = useTheme();
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill }, style]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    borderRadius: 999
  }
});
