import SwiftUI
import SwiftData

struct SettingsView: View {
    @EnvironmentObject private var settings: AppSettings
    @EnvironmentObject private var authViewModel: AuthViewModel
    @Query(sort: \ErrorLogEntry.createdAt, order: .reverse) private var errorLogs: [ErrorLogEntry]

    var body: some View {
        NavigationStack {
            List {
                Section("settings.appearance") {
                    Picker("settings.appearance", selection: Binding(
                        get: { settings.appearance },
                        set: { settings.appearance = $0 }
                    )) {
                        Text("settings.appearance.system").tag(AppSettings.Appearance.system)
                        Text("settings.appearance.light").tag(AppSettings.Appearance.light)
                        Text("settings.appearance.dark").tag(AppSettings.Appearance.dark)
                    }
                    .pickerStyle(.segmented)
                }

                Section("settings.language") {
                    Picker("settings.language", selection: $settings.languageCode) {
                        Text("Português").tag("pt-BR")
                        Text("English").tag("en")
                    }
                }

                Section("settings.logs") {
                    if errorLogs.isEmpty {
                        Text("settings.logs.empty")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(errorLogs.prefix(10)) { log in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(log.category).font(.headline)
                                Text(log.message).font(.footnote)
                                Text(log.createdAt.formatted(date: .abbreviated, time: .shortened))
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                Section {
                    Button("settings.logout", role: .destructive) {
                        authViewModel.signOut()
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("settings.title")
        }
    }
}
