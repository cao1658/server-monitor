import Foundation

struct User: Identifiable, Codable {
    let id: String
    let name: String
    let email: String
    let role: UserRole
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name
        case email
        case role
    }
}

enum UserRole: String, Codable {
    case user
    case admin
    
    var displayName: String {
        switch self {
        case .user: return "普通用户"
        case .admin: return "管理员"
        }
    }
    
    var canManageUsers: Bool {
        return self == .admin
    }
}

struct AuthResponse: Codable {
    let success: Bool
    let accessToken: String
    let refreshToken: String
    let user: User
}