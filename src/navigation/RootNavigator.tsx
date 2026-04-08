import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import { AppTabs } from "./AppTabs";
import { SignUpScreen } from "../screens/SignUpScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";
import { useI18n } from "../i18n";
import { useAppContext } from "../state/AppContext";

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { t } = useI18n();
  const { authUser } = useAppContext();
  const isAuthenticated = Boolean(authUser);

  return (
    <Stack.Navigator key={isAuthenticated ? "authenticated-stack" : "guest-stack"} screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="MainTabs" component={AppTabs} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: t("signup.title") }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: t("forgotPassword.title") }} />
        </>
      )}
    </Stack.Navigator>
  );
}
