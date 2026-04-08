import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/useTheme";

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "muted" | "accent";
};

export function Card({ children, style, variant = "default" }: CardProps) {
  const { colors, radius, isDark } = useTheme();

  const backgroundColor =
    variant === "muted" ? colors.surfaceMuted : variant === "accent" ? colors.surfaceAlt : colors.surfaceRaised;
  const borderWidth = variant === "accent" ? 4 : 2;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor: colors.border,
          borderRadius: radius.lg,
          borderWidth,
          shadowColor: isDark ? "#000000" : "#CBD5E1",
          shadowOpacity: isDark ? 0.45 : 1,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: 16,
    gap: 10
  }
});
