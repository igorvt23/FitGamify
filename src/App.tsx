import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RootNavigator } from "./navigation/RootNavigator";
import { AppProvider, useAppContext } from "./state/AppContext";
import { initDatabase } from "./db/database";
import { setupNotifications } from "./services/notifications";

function AppShell() {
  const { theme, loading, bootstrap } = useAppContext();

  useEffect(() => {
    const run = async () => {
      await initDatabase();
      await setupNotifications();
      await bootstrap();
    };
    void run();
  }, [bootstrap]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme === "dark" ? DarkTheme : DefaultTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}
