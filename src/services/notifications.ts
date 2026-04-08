import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { AppLanguage, WorkoutReminderSettings, Weekday } from "../types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

const LEGACY_DAILY_IDENTIFIER = "fitgamify-daily-reminder";
const WEEKLY_REMINDER_IDENTIFIER_PREFIX = "fitgamify-weekly-reminder-";

const REMINDER_MESSAGES: Record<AppLanguage, { title: string; bodies: string[] }> = {
  "pt-BR": {
    title: "Missao FitGamify",
    bodies: [
      "Seu treino te espera. Vai deixar o seu eu de ontem vencer?",
      "Hora de subir de nivel. Hoje voce treina, sem desculpas.",
      "Desafio do dia liberado: complete seu treino e avance.",
      "Seu futuro forte depende da decisao dos proximos minutos."
    ]
  },
  en: {
    title: "FitGamify Mission",
    bodies: [
      "Your workout is waiting. Will yesterday's you win?",
      "Time to level up. Train today, no excuses.",
      "Daily challenge unlocked: finish your workout.",
      "Your stronger future starts with this session."
    ]
  },
  es: {
    title: "Mision FitGamify",
    bodies: [
      "Tu entrenamiento te espera. No te quedes atras hoy.",
      "Es hora de subir de nivel. Entrena hoy, sin excusas.",
      "Desafio del dia: completa tu entrenamiento.",
      "Tu version mas fuerte empieza en esta sesion."
    ]
  }
};

export async function setupNotifications() {
  await ensureNotificationPermission();
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("fitgamify-reminders", {
      name: "Lembretes FitGamify",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default"
    }).catch(() => undefined);
  }
}

export async function sendMotivationalNotification(t: (key: string) => string) {
  const bodies = [
    t("notification.motivation.body1"),
    t("notification.motivation.body2"),
    t("notification.motivation.body3"),
    t("notification.motivation.body4"),
    t("notification.motivation.body5")
  ];
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

export async function applyWorkoutReminderSchedule(settings: WorkoutReminderSettings, language: AppLanguage) {
  await cancelWorkoutReminderSchedule();

  const granted = await ensureNotificationPermission();
  if (!granted) {
    return;
  }

  const normalized = normalizeWorkoutReminderSettings(settings);
  if (!normalized.enabled || normalized.weekdays.length === 0) {
    return;
  }

  const copy = REMINDER_MESSAGES[language] ?? REMINDER_MESSAGES["pt-BR"];
  for (const weekday of normalized.weekdays) {
    const body = copy.bodies[Math.floor(Math.random() * copy.bodies.length)];
    await Notifications.scheduleNotificationAsync({
      identifier: `${WEEKLY_REMINDER_IDENTIFIER_PREFIX}${weekday}`,
      content: {
        title: copy.title,
        body
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: weekdayToExpoWeekday(weekday),
        hour: normalized.hour,
        minute: normalized.minute
      }
    });
  }
}

async function cancelWorkoutReminderSchedule() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  for (const item of scheduled) {
    if (item.identifier === LEGACY_DAILY_IDENTIFIER || item.identifier.startsWith(WEEKLY_REMINDER_IDENTIFIER_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier).catch(() => undefined);
    }
  }
  await Notifications.cancelScheduledNotificationAsync(LEGACY_DAILY_IDENTIFIER).catch(() => undefined);
}

async function ensureNotificationPermission() {
  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.granted) {
    return true;
  }
  const request = await Notifications.requestPermissionsAsync();
  return request.granted;
}

function normalizeWorkoutReminderSettings(settings: WorkoutReminderSettings): WorkoutReminderSettings {
  const hour = Math.max(0, Math.min(23, Math.floor(Number(settings.hour) || 0)));
  const minute = Math.max(0, Math.min(59, Math.floor(Number(settings.minute) || 0)));
  const weekdays = [...new Set(settings.weekdays.map((item) => normalizeWeekday(item)))].sort((a, b) => a - b);
  return {
    enabled: Boolean(settings.enabled),
    hour,
    minute,
    weekdays
  };
}

function normalizeWeekday(value: number): Weekday {
  const wrapped = ((Math.floor(Number(value) || 0) % 7) + 7) % 7;
  return wrapped as Weekday;
}

function weekdayToExpoWeekday(day: Weekday) {
  return (day + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}
