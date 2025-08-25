import Foundation
import Combine

class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var user: User?
    @Published var isLoading = false
    @Published var error: String?
    
    private let authService = AuthService()
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        // 检查是否已有存储的令牌
        checkAuthStatus()
    }
    
    func login(email: String, password: String) {
        isLoading = true
        error = nil
        
        authService.login(email: email, password: password)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = error.localizedDescription
                }
            } receiveValue: { [weak self] response in
                self?.user = response.user
                self?.isAuthenticated = true
                self?.saveAuthToken(response.accessToken, refreshToken: response.refreshToken)
            }
            .store(in: &cancellables)
    }
    
    func register(name: String, email: String, password: String) {
        isLoading = true
        error = nil
        
        authService.register(name: name, email: email, password: password)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = error.localizedDescription
                }
            } receiveValue: { [weak self] response in
                self?.user = response.user
                self?.isAuthenticated = true
                self?.saveAuthToken(response.accessToken, refreshToken: response.refreshToken)
            }
            .store(in: &cancellables)
    }
    
    func logout() {
        isLoading = true
        error = nil
        
        authService.logout()
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isLoading = false
                // 即使后端请求失败，也清除本地令牌
                self?.clearAuthToken()
                self?.isAuthenticated = false
                self?.user = nil
            } receiveValue: { _ in
                // 成功注销
            }
            .store(in: &cancellables)
    }
    
    private func checkAuthStatus() {
        if let token = UserDefaults.standard.string(forKey: "authToken") {
            // 有令牌，验证其有效性
            isAuthenticated = true
            // 获取用户信息
            fetchUserProfile()
        }
    }
    
    private func fetchUserProfile() {
        authService.getUserProfile()
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                if case .failure(_) = completion {
                    // 令牌可能已过期
                    self?.isAuthenticated = false
                    self?.clearAuthToken()
                }
            } receiveValue: { [weak self] user in
                self?.user = user
            }
            .store(in: &cancellables)
    }
    
    private func saveAuthToken(_ token: String, refreshToken: String) {
        UserDefaults.standard.set(token, forKey: "authToken")
        UserDefaults.standard.set(refreshToken, forKey: "refreshToken")
    }
    
    private func clearAuthToken() {
        UserDefaults.standard.removeObject(forKey: "authToken")
        UserDefaults.standard.removeObject(forKey: "refreshToken")
    }
}