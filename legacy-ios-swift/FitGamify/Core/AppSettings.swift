import SwiftUI

final class AppSettings: ObservableObject {
    enum Appearance: String, CaseIterable, Identifiable {
        case system
        case light
        case dark

        var id: String { rawValue }
    }

    @AppStorage("app.language.code") var languageCode: String = "pt-BR"
    @AppStorage("app.appearance") private var appearanceRaw: String = Appearance.system.rawValue

    var colorScheme: ColorScheme? {
        switch Appearance(rawValue: appearanceRaw) ?? .system {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }

    var appearance: Appearance {
        get { Appearance(rawValue: appearanceRaw) ?? .system }
        set { appearanceRaw = newValue.rawValue; objectWillChange.send() }
    }
}
