import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/useTheme";

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "muted" | "accent";
};

export function Card({ children, style, variant = "default" }: CardProps) {
  const { colors, radius, shadow } = useTheme();

  const backgroundColor =
    variant === "muted" ? colors.surfaceMuted : variant === "accent" ? colors.surfaceAlt : colors.surfaceRaised;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor: colors.border,
          borderRadius: radius.lg
        },
        shadow.card,
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: 14,
    borderWidth: 1,
    gap: 8
  }
});
