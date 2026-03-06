import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            WorkoutTodayView()
                .tabItem {
                    Label("tab.workout", systemImage: "dumbbell")
                }

            DashboardView()
                .tabItem {
                    Label("tab.dashboard", systemImage: "chart.xyaxis.line")
                }

            AchievementsView()
                .tabItem {
                    Label("tab.achievements", systemImage: "rosette")
                }

            SettingsView()
                .tabItem {
                    Label("tab.settings", systemImage: "gear")
                }
        }
    }
}
