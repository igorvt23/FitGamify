import SwiftUI
import SwiftData

struct AchievementsView: View {
    @Query(sort: \AchievementRecord.unlockedAt, order: .reverse) private var achievements: [AchievementRecord]

    var body: some View {
        NavigationStack {
            List {
                if achievements.isEmpty {
                    ContentUnavailableView("achievement.empty.title", systemImage: "rosette", description: Text("achievement.empty.description"))
                } else {
                    ForEach(achievements) { record in
                        VStack(alignment: .leading, spacing: 6) {
                            Label(record.title, systemImage: "star.circle.fill")
                                .foregroundStyle(.yellow)
                            Text(record.detail).font(.subheadline)
                            Text(record.unlockedAt.formatted(date: .abbreviated, time: .omitted))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
            .navigationTitle("achievement.title")
            .listStyle(.insetGrouped)
        }
    }
}
