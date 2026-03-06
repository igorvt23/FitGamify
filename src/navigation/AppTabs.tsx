import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { WorkoutScreen } from "../screens/WorkoutScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { AchievementsScreen } from "../screens/AchievementsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { PlansScreen } from "../screens/PlansScreen";
import { useI18n } from "../i18n";

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

  return (
    <Tab.Navigator initialRouteName="Workout" screenOptions={{ headerTitleAlign: "center" }}>
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{
          title: t("tab.workout"),
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="dumbbell" color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="Plans"
        component={PlansScreen}
        options={{
          title: t("tab.plans"),
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="calendar-edit" color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: t("tab.dashboard"),
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="chart-line" color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{
          title: t("tab.achievements"),
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="trophy-award" color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t("tab.settings"),
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog-outline" color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}
