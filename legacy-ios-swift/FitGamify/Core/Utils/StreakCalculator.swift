import Foundation

enum StreakCalculator {
    static func updatedStreak(lastCheckInAt: Date?, now: Date = .now, calendar: Calendar = .current) -> Int {
        guard let lastCheckInAt else { return 1 }
        if calendar.isDate(lastCheckInAt, inSameDayAs: now) {
            return 0
        }

        let diff = calendar.dateComponents([.day], from: calendar.startOfDay(for: lastCheckInAt), to: calendar.startOfDay(for: now)).day ?? 0
        if diff == 1 { return 1 }
        return 0
    }
}
