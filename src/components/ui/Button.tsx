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

export function Button({
  label,
  onPress,
  disabled,
  style,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  pill
}: ButtonProps) {
  const { colors, radius, typography } = useTheme();

  const sizeStyle = sizeStyles[size];
  const palette = getVariantPalette(variant, colors);
  const isGhost = variant === "ghost";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyle,
        {
          borderRadius: pill ? radius.pill : radius.md,
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          borderWidth: isGhost ? 0 : 2,
          borderBottomWidth: isGhost ? 0 : 4
        },
        pressed && !disabled
          ? isGhost
            ? { opacity: 0.85, transform: [{ scale: 0.97 }] }
            : { borderBottomWidth: 0, transform: [{ translateY: 4 }] }
          : null,
        disabled ? styles.disabled : null,
        style
      ]}
    >
      <View style={styles.row}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <Text style={[styles.label, { color: palette.textColor, fontFamily: typography.title }]}>{label}</Text>
        {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
      </View>
    </Pressable>
  );
}

function getVariantPalette(variant: ButtonVariant, colors: ReturnType<typeof useTheme>["colors"]) {
  if (variant === "secondary") {
    return {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      textColor: colors.text
    };
  }

  if (variant === "danger") {
    return {
      backgroundColor: colors.danger,
      borderColor: colors.primaryShadow,
      textColor: "#FFFFFF"
    };
  }

  if (variant === "ghost") {
    return {
      backgroundColor: "transparent",
      borderColor: "transparent",
      textColor: colors.text
    };
  }

  if (variant === "outline") {
    return {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      textColor: colors.text
    };
  }

  return {
    backgroundColor: colors.primary,
    borderColor: colors.primaryShadow,
    textColor: "#FFFFFF"
  };
}

const sizeStyles = StyleSheet.create({
  sm: {
    paddingVertical: 10,
    paddingHorizontal: 14
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 18
  },
  lg: {
    paddingVertical: 14,
    paddingHorizontal: 20
  }
});

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center"
  },
  disabled: {
    opacity: 0.55
  },
  label: {
    fontWeight: "700",
    fontSize: 14
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  icon: {
    alignItems: "center",
    justifyContent: "center"
  }
});
