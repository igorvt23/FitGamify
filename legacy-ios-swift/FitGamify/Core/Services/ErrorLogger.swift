import Foundation
import SwiftData
import os

final class ErrorLogger {
    static let shared = ErrorLogger()

    private let logger = Logger(subsystem: "com.fitgamify.app", category: "error")

    private init() {}

    func log(_ error: Error, category: String, context: ModelContext? = nil) {
        logger.error("[\(category)] \(error.localizedDescription)")
        guard let context else { return }
        let entry = ErrorLogEntry(category: category, message: error.localizedDescription)
        context.insert(entry)
    }

    func logMessage(_ message: String, category: String, context: ModelContext? = nil) {
        logger.error("[\(category)] \(message)")
        guard let context else { return }
        let entry = ErrorLogEntry(category: category, message: message)
        context.insert(entry)
    }
}
