import Foundation
import SwiftData

@Model
final class WorkoutSession {
    var id: UUID
    var date: Date
    var checkInAt: Date?
    var notes: String
    @Relationship(deleteRule: .cascade, inverse: \ExerciseEntry.session)
    var exercises: [ExerciseEntry]

    init(
        id: UUID = UUID(),
        date: Date = .now,
        checkInAt: Date? = nil,
        notes: String = "",
        exercises: [ExerciseEntry] = []
    ) {
        self.id = id
        self.date = date
        self.checkInAt = checkInAt
        self.notes = notes
        self.exercises = exercises
    }

    var completed: Bool {
        checkInAt != nil
    }

    var totalVolume: Double {
        exercises.reduce(0) { $0 + ($1.weightKg * Double($1.sets * $1.reps)) }
    }

    var averageIntensity: Double {
        guard !exercises.isEmpty else { return 0 }
        return exercises.reduce(0) { $0 + $1.intensity }.rounded() / Double(exercises.count)
    }
}

@Model
final class ExerciseEntry {
    var id: UUID
    var name: String
    var sets: Int
    var reps: Int
    var weightKg: Double
    var intensity: Double
    var referenceImageName: String
    var session: WorkoutSession?

    init(
        id: UUID = UUID(),
        name: String,
        sets: Int,
        reps: Int,
        weightKg: Double = 0,
        intensity: Double = 5,
        referenceImageName: String = "figure.strengthtraining.traditional"
    ) {
        self.id = id
        self.name = name
        self.sets = sets
        self.reps = reps
        self.weightKg = weightKg
        self.intensity = intensity
        self.referenceImageName = referenceImageName
    }
}

@Model
final class AchievementRecord {
    var id: UUID
    var code: String
    var title: String
    var detail: String
    var unlockedAt: Date

    init(id: UUID = UUID(), code: String, title: String, detail: String, unlockedAt: Date = .now) {
        self.id = id
        self.code = code
        self.title = title
        self.detail = detail
        self.unlockedAt = unlockedAt
    }
}

@Model
final class UserProfile {
    var id: UUID
    var displayName: String
    var currentStreak: Int
    var lastCheckInAt: Date?

    init(id: UUID = UUID(), displayName: String = "Atleta", currentStreak: Int = 0, lastCheckInAt: Date? = nil) {
        self.id = id
        self.displayName = displayName
        self.currentStreak = currentStreak
        self.lastCheckInAt = lastCheckInAt
    }
}

@Model
final class ErrorLogEntry {
    var id: UUID
    var category: String
    var message: String
    var createdAt: Date

    init(id: UUID = UUID(), category: String, message: String, createdAt: Date = .now) {
        self.id = id
        self.category = category
        self.message = message
        self.createdAt = createdAt
    }
}
