export function calculateUpdatedStreak(lastCheckInIso: string | null, now = new Date()): number {
  if (!lastCheckInIso) {
    return 1;
  }
  const lastDate = new Date(lastCheckInIso);
  if (Number.isNaN(lastDate.getTime())) {
    return 1;
  }
  const diff = daysBetween(startOfDay(lastDate), startOfDay(now));

  if (diff === 0) {
    return 0;
  }
  if (diff === 1) {
    return 1;
  }
  return -1;
}

export function reconcileStreakAfterMissedDay(currentStreak: number, lastCheckInIso: string | null, now = new Date()): number {
  const normalizedCurrent = Math.max(0, Math.floor(Number(currentStreak) || 0));
  if (!lastCheckInIso) {
    return 0;
  }

  const lastDate = new Date(lastCheckInIso);
  if (Number.isNaN(lastDate.getTime())) {
    return 0;
  }

  const diff = daysBetween(startOfDay(lastDate), startOfDay(now));
  if (diff > 1) {
    return 0;
  }
  return normalizedCurrent;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
