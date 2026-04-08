import SwiftUI
import SwiftData

struct WorkoutTodayView: View {
    @Environment(\.modelContext) private var modelContext
    @EnvironmentObject private var notificationService: NotificationService
    @Query(sort: \WorkoutSession.date, order: .reverse) private var sessions: [WorkoutSession]
    @Query private var profiles: [UserProfile]
    @Query private var achievements: [AchievementRecord]

    private var todaySession: WorkoutSession? {
        sessions.first { Calendar.current.isDateInToday($0.date) }
    }

    var body: some View {
        NavigationStack {
            Group {
                if let session = todaySession {
                    List {
                        Section("workout.today.section") {
                            ForEach(session.exercises) { exercise in
                                ExerciseRow(exercise: exercise)
                            }
                        }

                        Section("workout.today.summary") {
                            LabeledContent(String(localized: "workout.total.volume"), value: "\(Int(session.totalVolume)) kg")
                            LabeledContent(String(localized: "workout.avg.intensity"), value: String(format: "%.1f", session.averageIntensity))
                        }
                    }
                    .listStyle(.insetGrouped)
                    .safeAreaInset(edge: .bottom) {
                        checkInButton(session: session)
                    }
                } else {
                    ContentUnavailableView("workout.empty.title", systemImage: "calendar.badge.exclamationmark", description: Text("workout.empty.description"))
                        .overlay(alignment: .bottom) {
                            Button("workout.create.today") {
                                createTodayWorkout()
                            }
                            .buttonStyle(.borderedProminent)
                            .padding()
                        }
                }
            }
            .navigationTitle("workout.today.title")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("workout.reminder.schedule") {
                        notificationService.scheduleDailyReminder()
                    }
                }
            }
            .onAppear {
                ensureProfileExists()
            }
        }
    }

    @ViewBuilder
    private func checkInButton(session: WorkoutSession) -> some View {
        Button {
            handleCheckIn(session: session)
        } label: {
            Text(session.completed ? "workout.checked.in" : "workout.check.in")
                .frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .padding()
        .disabled(session.completed)
    }

    private func createTodayWorkout() {
        let newSession = WorkoutSession(date: .now, exercises: [
            ExerciseEntry(name: "Agachamento", sets: 4, reps: 10, referenceImageName: "figure.strengthtraining.traditional"),
            ExerciseEntry(name: "Supino", sets: 4, reps: 8, referenceImageName: "figure.strengthtraining.functional"),
            ExerciseEntry(name: "Remada", sets: 3, reps: 12, referenceImageName: "figure.rower")
        ])
        modelContext.insert(newSession)
        saveContext(category: "create-workout")
    }

    private func handleCheckIn(session: WorkoutSession) {
        guard !session.completed else { return }
        session.checkInAt = .now

        let profile = profiles.first ?? UserProfile()
        if profiles.isEmpty { modelContext.insert(profile) }

        let streakIncrement = StreakCalculator.updatedStreak(lastCheckInAt: profile.lastCheckInAt)
        if streakIncrement == 0 {
            profile.currentStreak = 1
        } else {
            profile.currentStreak += streakIncrement
        }
        profile.lastCheckInAt = .now

        unlockAchievementsIfNeeded(currentStreak: profile.currentStreak)
        notificationService.scheduleMotivationalMessage()
        saveContext(category: "checkin")
    }

    private func unlockAchievementsIfNeeded(currentStreak: Int) {
        let totalCompleted = sessions.filter { $0.completed }.count
        let unlocked = Set(achievements.map(\.code))
        let records = AchievementEngine.evaluate(totalCompletedWorkouts: totalCompleted, currentStreak: currentStreak, unlockedCodes: unlocked)
        for record in records {
            modelContext.insert(record)
        }
    }

    private func ensureProfileExists() {
        if profiles.isEmpty {
            modelContext.insert(UserProfile())
            saveContext(category: "create-profile")
        }
    }

    private func saveContext(category: String) {
        do {
            try modelContext.save()
        } catch {
            ErrorLogger.shared.log(error, category: category, context: modelContext)
        }
    }
}

private struct ExerciseRow: View {
    @Bindable var exercise: ExerciseEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: exercise.referenceImageName)
                    .foregroundStyle(.orange)
                Text(exercise.name).font(.headline)
            }

            Stepper(value: $exercise.weightKg, in: 0...300, step: 2.5) {
                Text("\(String(localized: "workout.weight")): \(exercise.weightKg, specifier: "%.1f") kg")
            }

            VStack(alignment: .leading) {
                Text("\(String(localized: "workout.intensity")): \(exercise.intensity, specifier: "%.1f")")
                Slider(value: $exercise.intensity, in: 1...10, step: 0.5)
            }

            Text("\(exercise.sets)x\(exercise.reps)")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 6)
    }
}
