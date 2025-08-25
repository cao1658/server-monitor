import Foundation
import Combine

class AuthService {
    private let apiService = ApiService()
    
    func login(email: String, password: String) -> AnyPublisher<AuthResponse, Error> {
        let body: [String: Any] = [
            "email": email,
            "password": password
        ]
        
        return apiService.request(
            endpoint: "/auth/login",
            method: "POST",
            body: body
        )
    }
    
    func register(name: String, email: String, password: String) -> AnyPublisher<AuthResponse, Error> {
        let body: [String: Any] = [
            "name": name,
            "email": email,
            "password": password
        ]
        
        return apiService.request(
            endpoint: "/auth/register",
            method: "POST",
            body: body
        )
    }
    
    func logout() -> AnyPublisher<EmptyResponse, Error> {
        return apiService.request(
            endpoint: "/auth/logout",
            method: "POST"
        )
    }
    
    func getUserProfile() -> AnyPublisher<User, Error> {
        return apiService.request(endpoint: "/users/me")
    }
    
    func refreshToken(refreshToken: String) -> AnyPublisher<TokenResponse, Error> {
        let body: [String: Any] = [
            "refreshToken": refreshToken
        ]
        
        return apiService.request(
            endpoint: "/auth/refresh-token",
            method: "POST",
            body: body
        )
    }
}

struct EmptyResponse: Codable {
    let success: Bool
}

struct TokenResponse: Codable {
    let success: Bool
    let accessToken: String
}