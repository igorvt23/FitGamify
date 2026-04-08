import Foundation

#if canImport(GoogleSignIn)
import GoogleSignIn
#endif

final class GoogleAuthService: AuthService {
    func signInWithGoogle() async throws -> AuthUser {
        #if canImport(GoogleSignIn)
        throw AuthError.unavailable
        #else
        return AuthUser(id: UUID().uuidString, name: "Usuário Local", email: nil)
        #endif
    }

    func signOut() throws {}
}
