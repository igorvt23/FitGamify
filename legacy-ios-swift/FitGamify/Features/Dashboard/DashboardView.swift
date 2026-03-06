import SwiftUI
import SwiftData
import Charts

struct DashboardView: View {
    @Query(sort: \WorkoutSession.date, order: .forward) private var sessions: [WorkoutSession]
    @Query private var achievements: [AchievementRecord]
    @Query private var profiles: [UserProfile]

    private var completedSessions: [WorkoutSession] {
        sessions.filter { $0.completed }
    }

    var body: some View {
        NavigationStack {
            List {
                Section("dashboard.metrics") {
                    LabeledContent(String(localized: "dashboard.total.workouts"), value: "\(completedSessions.count)")
                    LabeledContent(String(localized: "dashboard.current.streak"), value: "\(profiles.first?.currentStreak ?? 0)")
                    LabeledContent(String(localized: "dashboard.achievements"), value: "\(achievements.count)")
                }

                Section("dashboard.volume.history") {
                    if completedSessions.isEmpty {
                        Text("dashboard.empty")
                            .foregroundStyle(.secondary)
                    } else {
                        Chart(completedSessions, id: \.id) { session in
                            LineMark(
                                x: .value("Date", session.date),
                                y: .value("Volume", session.totalVolume)
                            )
                            PointMark(
                                x: .value("Date", session.date),
                                y: .value("Volume", session.totalVolume)
                            )
                        }
                        .frame(height: 220)
                    }
                }
            }
            .navigationTitle("dashboard.title")
            .listStyle(.insetGrouped)
        }
    }
}
