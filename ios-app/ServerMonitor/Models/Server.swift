import Foundation

struct Server: Identifiable, Codable {
    let id: String
    let name: String
    let host: String
    let port: Int
    let username: String
    let os: String?
    let status: ServerStatus
    let description: String?
    let createdAt: Date
    let lastCheck: Date?
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name
        case host
        case port
        case username
        case os
        case status
        case description
        case createdAt
        case lastCheck
    }
}

enum ServerStatus: String, Codable {
    case online
    case offline
    case warning
    case error
    
    var displayName: String {
        switch self {
        case .online: return "在线"
        case .offline: return "离线"
        case .warning: return "警告"
        case .error: return "错误"
        }
    }
    
    var color: String {
        switch self {
        case .online: return "green"
        case .offline: return "gray"
        case .warning: return "yellow"
        case .error: return "red"
        }
    }
}