import { getTemplatesNeedingRefresh, isTemplateRefreshDue } from "../src/core/templateRefresh";
import { WorkoutTemplate } from "../src/types";

function buildTemplate(createdAtIso: string): WorkoutTemplate {
  return {
    id: `template-${createdAtIso}`,
    name: "Treino A",
    muscleGroup: "Peito",
    orderIndex: 0,
    assignedWeekdays: [],
    createdAtIso,
    isActive: true
  };
}

describe("template refresh rules", () => {
  it("returns false before completing three months", () => {
    expect(isTemplateRefreshDue("2026-01-10T10:00:00.000Z", new Date("2026-04-09T10:00:00.000Z"))).toBe(false);
  });

  it("returns true when it reaches exactly three months", () => {
    expect(isTemplateRefreshDue("2026-01-10T10:00:00.000Z", new Date("2026-04-10T10:00:00.000Z"))).toBe(true);
  });

  it("handles month end dates", () => {
    expect(isTemplateRefreshDue("2026-01-31T10:00:00.000Z", new Date("2026-04-30T10:00:00.000Z"))).toBe(true);
  });

  it("filters only templates that need refresh", () => {
    const due = buildTemplate("2025-12-01T10:00:00.000Z");
    const fresh = buildTemplate("2026-03-01T10:00:00.000Z");
    const result = getTemplatesNeedingRefresh([due, fresh], new Date("2026-04-07T10:00:00.000Z"));
    expect(result.map((item) => item.id)).toEqual([due.id]);
  });

  it("ignores inactive templates in refresh reminders", () => {
    const inactiveDue = { ...buildTemplate("2025-12-01T10:00:00.000Z"), isActive: false };
    const result = getTemplatesNeedingRefresh([inactiveDue], new Date("2026-04-07T10:00:00.000Z"));
    expect(result).toEqual([]);
  });

  it("ignores invalid creation dates", () => {
    expect(isTemplateRefreshDue("invalid-date", new Date("2026-04-10T10:00:00.000Z"))).toBe(false);
  });
});
