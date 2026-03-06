import XCTest
@testable import FitGamify

final class StreakCalculatorTests: XCTestCase {
    private let calendar = Calendar(identifier: .gregorian)

    func testFirstCheckInStartsAtOne() {
        let streak = StreakCalculator.updatedStreak(lastCheckInAt: nil, now: Date())
        XCTAssertEqual(streak, 1)
    }

    func testYesterdayCheckInReturnsIncrement() {
        let now = calendar.date(from: DateComponents(year: 2026, month: 3, day: 3, hour: 10))!
        let yesterday = calendar.date(byAdding: .day, value: -1, to: now)!
        let streak = StreakCalculator.updatedStreak(lastCheckInAt: yesterday, now: now, calendar: calendar)
        XCTAssertEqual(streak, 1)
    }

    func testGapResets() {
        let now = calendar.date(from: DateComponents(year: 2026, month: 3, day: 3, hour: 10))!
        let oldDate = calendar.date(byAdding: .day, value: -3, to: now)!
        let streak = StreakCalculator.updatedStreak(lastCheckInAt: oldDate, now: now, calendar: calendar)
        XCTAssertEqual(streak, 0)
    }
}
