import Foundation

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var user: AuthUser?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let authService: AuthService

    init(authService: AuthService) {
        self.authService = authService
    }

    func loginWithGoogle() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let user = try await authService.signInWithGoogle()
            self.user = user
            isAuthenticated = true
        } catch {
            errorMessage = error.localizedDescription
            ErrorLogger.shared.log(error, category: "auth")
        }
    }

    func signOut() {
        do {
            try authService.signOut()
            user = nil
            isAuthenticated = false
        } catch {
            errorMessage = error.localizedDescription
            ErrorLogger.shared.log(error, category: "auth")
        }
    }
}
