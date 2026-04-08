import Foundation

enum AchievementCode: String, CaseIterable {
    case firstCheckIn
    case streak3
    case streak7
    case workouts10
}

struct AchievementTemplate {
    let code: AchievementCode
    let titleKey: String
    let detailKey: String
}

enum AchievementEngine {
    static let templates: [AchievementTemplate] = [
        .init(code: .firstCheckIn, titleKey: "achievement.first.title", detailKey: "achievement.first.detail"),
        .init(code: .streak3, titleKey: "achievement.streak3.title", detailKey: "achievement.streak3.detail"),
        .init(code: .streak7, titleKey: "achievement.streak7.title", detailKey: "achievement.streak7.detail"),
        .init(code: .workouts10, titleKey: "achievement.workouts10.title", detailKey: "achievement.workouts10.detail")
    ]

    static func evaluate(totalCompletedWorkouts: Int, currentStreak: Int, unlockedCodes: Set<String>) -> [AchievementRecord] {
        var newRecords: [AchievementRecord] = []

        for template in templates {
            if unlockedCodes.contains(template.code.rawValue) { continue }
            let unlocked: Bool

            switch template.code {
            case .firstCheckIn: unlocked = totalCompletedWorkouts >= 1
            case .streak3: unlocked = currentStreak >= 3
            case .streak7: unlocked = currentStreak >= 7
            case .workouts10: unlocked = totalCompletedWorkouts >= 10
            }

            if unlocked {
                newRecords.append(
                    AchievementRecord(
                        code: template.code.rawValue,
                        title: NSLocalizedString(template.titleKey, comment: ""),
                        detail: NSLocalizedString(template.detailKey, comment: "")
                    )
                )
            }
        }

        return newRecords
    }
}
