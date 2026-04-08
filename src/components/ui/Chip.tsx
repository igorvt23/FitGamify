import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { useTheme } from "../../theme/useTheme";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function Chip({ label, selected, onPress, style }: ChipProps) {
  const { colors, radius, typography } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: radius.pill,
          backgroundColor: selected ? colors.primary : colors.chip,
          borderColor: selected ? colors.primaryShadow : colors.border
        },
        pressed ? { borderBottomWidth: 1, transform: [{ translateY: 3 }] } : null,
        style
      ]}
    >
      <Text style={[styles.label, { color: selected ? "#FFFFFF" : colors.chipText, fontFamily: typography.body }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 2,
    borderBottomWidth: 4
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8
  }
});
