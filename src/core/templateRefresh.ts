import { WorkoutTemplate } from "../types";

export const TEMPLATE_REFRESH_INTERVAL_MONTHS = 3;

export function getTemplatesNeedingRefresh(
  templates: WorkoutTemplate[],
  now = new Date(),
  refreshIntervalMonths = TEMPLATE_REFRESH_INTERVAL_MONTHS
): WorkoutTemplate[] {
  return templates.filter((item) => item.isActive && isTemplateRefreshDue(item.createdAtIso, now, refreshIntervalMonths));
}

export function isTemplateRefreshDue(
  createdAtIso: string,
  now = new Date(),
  refreshIntervalMonths = TEMPLATE_REFRESH_INTERVAL_MONTHS
): boolean {
  if (!createdAtIso) {
    return false;
  }

  const createdAt = new Date(createdAtIso);
  if (Number.isNaN(createdAt.getTime())) {
    return false;
  }

  const normalizedInterval =
    Number.isFinite(refreshIntervalMonths) && refreshIntervalMonths > 0
      ? Math.floor(refreshIntervalMonths)
      : TEMPLATE_REFRESH_INTERVAL_MONTHS;
  const dueAt = addMonthsPreservingDay(createdAt, normalizedInterval);
  return now.getTime() >= dueAt.getTime();
}

function addMonthsPreservingDay(date: Date, months: number) {
  const next = new Date(date);
  const originalDay = next.getDate();
  next.setMonth(next.getMonth() + months);
  if (next.getDate() < originalDay) {
    next.setDate(0);
  }
  return next;
}
