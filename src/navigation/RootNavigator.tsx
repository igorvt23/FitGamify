import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import { AppTabs } from "./AppTabs";
import { SignUpScreen } from "../screens/SignUpScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { useI18n } from "../i18n";
import { useAppContext } from "../state/AppContext";

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  SignUp: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { t } = useI18n();
  const { authUser } = useAppContext();

  return (
    <Stack.Navigator initialRouteName={authUser ? "MainTabs" : "Login"}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MainTabs" component={AppTabs} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: t("signup.title") }} />
    </Stack.Navigator>
  );
}
