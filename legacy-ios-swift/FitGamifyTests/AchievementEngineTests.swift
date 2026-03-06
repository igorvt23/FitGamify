import XCTest
@testable import FitGamify

final class AchievementEngineTests: XCTestCase {
    func testUnlocksFirstCheckIn() {
        let unlocked = AchievementEngine.evaluate(
            totalCompletedWorkouts: 1,
            currentStreak: 1,
            unlockedCodes: []
        )

        XCTAssertTrue(unlocked.contains(where: { $0.code == AchievementCode.firstCheckIn.rawValue }))
    }

    func testDoesNotUnlockAlreadyUnlockedBadge() {
        let unlocked = AchievementEngine.evaluate(
            totalCompletedWorkouts: 12,
            currentStreak: 7,
            unlockedCodes: [AchievementCode.workouts10.rawValue]
        )

        XCTAssertFalse(unlocked.contains(where: { $0.code == AchievementCode.workouts10.rawValue }))
    }
}
