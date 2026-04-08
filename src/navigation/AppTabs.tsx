import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { WorkoutScreen } from "../screens/WorkoutScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { AchievementsScreen } from "../screens/AchievementsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { PlansScreen } from "../screens/PlansScreen";
import { useI18n } from "../i18n";
import { useTheme } from "../theme/useTheme";

type TabParamList = {
  Workout: undefined;
  Plans: undefined;
  Dashboard: undefined;
  Achievements: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function AppTabs() {
  const { t } = useI18n();
  const { colors, typography } = useTheme();

  const iconWrap = (name: React.ComponentProps<typeof MaterialCommunityIcons>["name"]) =>
    ({ size, focused }: { size: number; focused: boolean }) => (
      <View
        style={{
          padding: 6,
          borderRadius: 12,
          backgroundColor: focused ? colors.primarySoft : "transparent"
        }}
      >
        <MaterialCommunityIcons name={name} color={focused ? colors.primary : colors.textMuted} size={size} />
      </View>
    );

  return (
    <Tab.Navigator
      initialRouteName="Workout"
      screenOptions={{
        headerShown: false,
        headerTitleAlign: "center",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
          paddingTop: 6,
          borderRadius: 18,
          marginHorizontal: 12,
          marginBottom: 10,
          position: "absolute",
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4
        },
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontWeight: "700", fontSize: 11, fontFamily: typography.body },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text
      }}
    >
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{
          title: t("tab.workout"),
          tabBarIcon: iconWrap("dumbbell")
        }}
      />
      <Tab.Screen
        name="Plans"
        component={PlansScreen}
        options={{
          title: t("tab.plans"),
          tabBarIcon: iconWrap("calendar-edit")
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: t("tab.dashboard"),
          tabBarIcon: iconWrap("chart-line")
        }}
      />
      <Tab.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{
          title: t("tab.achievements"),
          tabBarIcon: iconWrap("trophy-award")
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t("tab.settings"),
          tabBarIcon: iconWrap("cog-outline")
        }}
      />
    </Tab.Navigator>
  );
}
