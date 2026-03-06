import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "figure.run")
                .font(.system(size: 56))
                .foregroundStyle(.orange)
            Text("app.title")
                .font(.largeTitle.bold())
            Text("auth.subtitle")
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button {
                Task { await authViewModel.loginWithGoogle() }
            } label: {
                HStack {
                    Image(systemName: "globe")
                    Text("auth.google.login")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .disabled(authViewModel.isLoading)
            .padding(.horizontal)

            if let errorMessage = authViewModel.errorMessage {
                Text(errorMessage).foregroundStyle(.red).font(.footnote)
            }
        }
        .padding()
    }
}
