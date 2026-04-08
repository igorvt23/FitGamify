export function calculateUpdatedStreak(lastCheckInIso: string | null, now = new Date()): number {
  if (!lastCheckInIso) {
    return 1;
  }
  const lastDate = new Date(lastCheckInIso);
  const diff = daysBetween(startOfDay(lastDate), startOfDay(now));

  if (diff === 0) {
    return 0;
  }
  if (diff === 1) {
    return 1;
  }
  return -1;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
