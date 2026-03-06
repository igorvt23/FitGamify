import Foundation
import UserNotifications

final class NotificationService: ObservableObject {
    private let center = UNUserNotificationCenter.current()

    func requestAuthorizationIfNeeded() {
        center.requestAuthorization(options: [.alert, .badge, .sound]) { _, _ in }
    }

    func scheduleDailyReminder(hour: Int = 20, minute: Int = 0) {
        var dateComponents = DateComponents()
        dateComponents.hour = hour
        dateComponents.minute = minute

        let content = UNMutableNotificationContent()
        content.title = String(localized: "notification.reminder.title")
        content.body = String(localized: "notification.reminder.body")
        content.sound = .default

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
        let request = UNNotificationRequest(identifier: "daily-workout-reminder", content: content, trigger: trigger)
        center.add(request)
    }

    func scheduleMotivationalMessage() {
        let messages = [
            String(localized: "notification.motivation.one"),
            String(localized: "notification.motivation.two"),
            String(localized: "notification.motivation.three")
        ]

        let content = UNMutableNotificationContent()
        content.title = String(localized: "notification.motivation.title")
        content.body = messages.randomElement() ?? "Seu proximo treino te espera."
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 10, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        center.add(request)
    }
}
