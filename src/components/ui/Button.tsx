import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/useTheme";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";

type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  pill?: boolean;
  pixel?: boolean;
};

export function Button({ label, onPress, disabled, style, variant = "primary", size = "md", leftIcon, rightIcon, pill, pixel }: ButtonProps) {
  const { colors, radius, typography } = useTheme();

  const sizeStyle = sizeStyles[size];
  const baseStyle: ViewStyle = {
    borderRadius: pill ? radius.pill : pixel ? radius.sm : radius.md,
    alignItems: "center",
    justifyContent: "center"
  };

  const variantStyle: ViewStyle =
    variant === "secondary"
      ? { backgroundColor: colors.primarySoft }
      : variant === "danger"
        ? { backgroundColor: colors.danger }
        : variant === "ghost"
          ? { backgroundColor: "transparent" }
          : variant === "outline"
            ? { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border }
            : { backgroundColor: colors.primary };

  const textColor =
    variant === "secondary"
      ? colors.primaryStrong
      : variant === "ghost" || variant === "outline"
        ? colors.text
        : "#FFFFFF";

  const pixelStyle: ViewStyle | null = pixel
    ? {
        borderWidth: 2,
        borderColor: variant === "primary" ? colors.primaryStrong : colors.border,
        shadowColor: colors.primaryShadow,
        shadowOpacity: 0.35,
        shadowRadius: 0,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4
      }
    : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        baseStyle,
        sizeStyle,
        variantStyle,
        pixelStyle,
        pressed && !disabled
          ? pixel
            ? { transform: [{ translateY: 1 }] }
            : { opacity: 0.9, transform: [{ scale: 0.98 }] }
          : null,
        disabled ? { opacity: 0.6 } : null,
        style
      ]}
    >
      <View style={styles.row}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <Text
          style={[
            styles.label,
            { color: textColor, fontFamily: typography.body },
            pixel ? { textTransform: "uppercase", letterSpacing: 0.6 } : null
          ]}
        >
          {label}
        </Text>
        {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
      </View>
    </Pressable>
  );
}

const sizeStyles = StyleSheet.create({
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  lg: {
    paddingVertical: 14,
    paddingHorizontal: 18
  }
});

const styles = StyleSheet.create({
  label: {
    fontWeight: "700",
    fontSize: 14
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  icon: {
    alignItems: "center",
    justifyContent: "center"
  }
});
