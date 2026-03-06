import Foundation

struct AuthUser {
    let id: String
    let name: String
    let email: String?
}

protocol AuthService {
    func signInWithGoogle() async throws -> AuthUser
    func signOut() throws
}

enum AuthError: LocalizedError {
    case unavailable
    case cancelled

    var errorDescription: String? {
        switch self {
        case .unavailable: return String(localized: "auth.error.unavailable")
        case .cancelled: return String(localized: "auth.error.cancelled")
        }
    }
}
