import React from "react";
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/useTheme";

type InputProps = TextInputProps & {
  containerStyle?: ViewStyle;
};

export function Input({ containerStyle, style, placeholderTextColor, ...props }: InputProps) {
  const { colors, radius, typography } = useTheme();

  return (
    <View style={containerStyle}>
      <TextInput
        placeholderTextColor={placeholderTextColor ?? colors.textMuted}
        style={[
          styles.input,
          {
            borderColor: colors.border,
            backgroundColor: colors.inputBg,
            color: colors.text,
            borderRadius: radius.md,
            fontFamily: typography.regular
          },
          style
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10
  }
});
