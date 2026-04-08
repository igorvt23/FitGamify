import { calculateUpdatedStreak } from "../src/core/streak";

describe("calculateUpdatedStreak", () => {
  it("starts at one when no previous check-in", () => {
    expect(calculateUpdatedStreak(null, new Date("2026-03-03T10:00:00.000Z"))).toBe(1);
  });

  it("increments when previous check-in was yesterday", () => {
    expect(
      calculateUpdatedStreak("2026-03-02T10:00:00.000Z", new Date("2026-03-03T10:00:00.000Z"))
    ).toBe(1);
  });

  it("returns zero when check-in already exists today", () => {
    expect(
      calculateUpdatedStreak("2026-03-03T08:00:00.000Z", new Date("2026-03-03T10:00:00.000Z"))
    ).toBe(0);
  });
});
