import React, { useState } from "react";
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from "react-native";

import { useTheme } from "../../theme/useTheme";

type InputProps = Omit<TextInputProps, "onFocus" | "onBlur"> & {
  containerStyle?: ViewStyle;
  onFocus?: TextInputProps["onFocus"];
  onBlur?: TextInputProps["onBlur"];
};

export function Input({ containerStyle, style, placeholderTextColor, onFocus, onBlur, ...props }: InputProps) {
  const { colors, radius, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={containerStyle}>
      <TextInput
        placeholderTextColor={placeholderTextColor ?? colors.textMuted}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          {
            borderColor: isFocused ? colors.primary : colors.border,
            backgroundColor: isFocused ? colors.surface : colors.inputBg,
            color: colors.text,
            borderRadius: radius.md,
            fontFamily: typography.body
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
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "700"
  }
});
