import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { WorkoutScreen } from "../screens/WorkoutScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { AchievementsScreen } from "../screens/AchievementsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { PlansScreen } from "../screens/PlansScreen";
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
  const { colors } = useTheme();

  const iconWrap = (name: React.ComponentProps<typeof MaterialCommunityIcons>["name"]) =>
    ({ size, focused }: { size: number; focused: boolean }) => (
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: focused ? colors.primarySoft : "transparent",
          borderColor: focused ? colors.primary : "transparent",
          borderWidth: 2
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
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 2,
          borderWidth: 2,
          borderColor: colors.tabBarBorder,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
          borderRadius: 24,
          marginHorizontal: 10,
          marginBottom: 10,
          position: "absolute",
          shadowColor: "#000000",
          shadowOpacity: 0.2,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6
        },
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {
          marginHorizontal: 4
        },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text
      }}
    >
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{
          tabBarIcon: iconWrap("dumbbell")
        }}
      />
      <Tab.Screen
        name="Plans"
        component={PlansScreen}
        options={{
          tabBarIcon: iconWrap("calendar-edit")
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: iconWrap("chart-line")
        }}
      />
      <Tab.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{
          tabBarIcon: iconWrap("trophy-award")
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: iconWrap("cog-outline")
        }}
      />
    </Tab.Navigator>
  );
}
