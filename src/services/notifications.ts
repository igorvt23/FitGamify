import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function setupNotifications() {
  const permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) {
    await Notifications.requestPermissionsAsync();
  }

  await Notifications.cancelScheduledNotificationAsync("fitgamify-daily-reminder").catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: "fitgamify-daily-reminder",
    content: {
      title: "FitGamify",
      body: "Seu treino de hoje esta pendente."
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0
    }
  });
}

export async function sendMotivationalNotification(t: (key: string) => string) {
  const bodies = [t("notification.motivation.body1"), t("notification.motivation.body2"), t("notification.motivation.body3")];
  await Notifications.scheduleNotificationAsync({
    content: {
      title: t("notification.motivation.title"),
      body: bodies[Math.floor(Math.random() * bodies.length)]
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5
    }
  });
}
