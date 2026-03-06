import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import { AppTabs } from "./AppTabs";
import { SignUpScreen } from "../screens/SignUpScreen";
import { useI18n } from "../i18n";

export type RootStackParamList = {
  MainTabs: undefined;
  SignUp: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { t } = useI18n();

  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={AppTabs} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: t("signup.title") }} />
    </Stack.Navigator>
  );
}

