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
          borderColor: selected ? colors.primary : colors.border
        },
        pressed ? { opacity: 0.9 } : null,
        style
      ]}
    >
      <Text style={[styles.label, { color: selected ? "#FFFFFF" : colors.chipText, fontFamily: typography.body }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1
  },
  label: {
    fontSize: 12,
    fontWeight: "700"
  }
});
