import SwiftUI
import SwiftData

@main
struct FitGamifyApp: App {
    @StateObject private var settings = AppSettings()
    @StateObject private var authViewModel = AuthViewModel(authService: GoogleAuthService())
    @StateObject private var notificationService = NotificationService()

    var sharedModelContainer: ModelContainer = {
        do {
            return try ModelContainer(for: WorkoutSession.self, ExerciseEntry.self, AchievementRecord.self, UserProfile.self, ErrorLogEntry.self)
        } catch {
            fatalError("Nao foi possivel iniciar SwiftData: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(settings)
                .environmentObject(authViewModel)
                .environmentObject(notificationService)
                .environment(\.locale, Locale(identifier: settings.languageCode))
                .preferredColorScheme(settings.colorScheme)
                .task {
                    notificationService.requestAuthorizationIfNeeded()
                }
        }
        .modelContainer(sharedModelContainer)
    }
}

