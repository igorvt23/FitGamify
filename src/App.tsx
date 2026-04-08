import React, { useEffect, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from "@expo-google-fonts/nunito";

import { RootNavigator } from "./navigation/RootNavigator";
import { AppProvider, useAppContext } from "./state/AppContext";
import { initDatabase } from "./db/database";
import { setupNotifications } from "./services/notifications";
import { useTheme } from "./theme/useTheme";

function AppShell() {
  const { loading, bootstrap } = useAppContext();
  const { colors, isDark } = useTheme();

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        primary: colors.primary
      }
    };
  }, [colors.background, colors.border, colors.primary, colors.surface, colors.text, isDark]);

  useEffect(() => {
    const run = async () => {
      try {
        await initDatabase();
      } catch (error) {
        console.warn("initDatabase failed", error);
      }

      try {
        await setupNotifications();
      } catch (error) {
        console.warn("setupNotifications failed", error);
      }

      await bootstrap();
    };
    void run();
  }, [bootstrap]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}
