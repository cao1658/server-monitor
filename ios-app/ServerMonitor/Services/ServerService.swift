import Foundation
import Combine

class ServerService {
    private let apiService = ApiService()
    
    func getServers() -> AnyPublisher<[Server], Error> {
        return apiService.request(endpoint: "/servers")
            .map { (response: ApiResponse<[Server]>) in
                return response.data
            }
            .eraseToAnyPublisher()
    }
    
    func getServer(id: String) -> AnyPublisher<Server, Error> {
        return apiService.request(endpoint: "/servers/\(id)")
            .map { (response: ApiResponse<Server>) in
                return response.data
            }
            .eraseToAnyPublisher()
    }
    
    func addServer(server: ServerRequest) -> AnyPublisher<Server, Error> {
        let body: [String: Any] = [
            "name": server.name,
            "host": server.host,
            "port": server.port,
            "username": server.username,
            "password": server.password ?? "",
            "privateKey": server.privateKey ?? "",
            "os": server.os ?? "",
            "description": server.description ?? "",
            "authMethod": server.authMethod
        ]
        
        return apiService.request(
            endpoint: "/servers",
            method: "POST",
            body: body
        )
        .map { (response: ApiResponse<Server>) in
            return response.data
        }
        .eraseToAnyPublisher()
    }
    
    func updateServer(id: String, server: ServerRequest) -> AnyPublisher<Server, Error> {
        var body: [String: Any] = [
            "name": server.name,
            "host": server.host,
            "port": server.port,
            "username": server.username,
            "os": server.os ?? "",
            "description": server.description ?? "",
            "authMethod": server.authMethod
        ]
        
        // 只有在提供密码或私钥时才包含它们
        if let password = server.password, !password.isEmpty {
            body["password"] = password
        }
        
        if let privateKey = server.privateKey, !privateKey.isEmpty {
            body["privateKey"] = privateKey
        }
        
        return apiService.request(
            endpoint: "/servers/\(id)",
            method: "PUT",
            body: body
        )
        .map { (response: ApiResponse<Server>) in
            return response.data
        }
        .eraseToAnyPublisher()
    }
    
    func deleteServer(id: String) -> AnyPublisher<EmptyResponse, Error> {
        return apiService.request(
            endpoint: "/servers/\(id)",
            method: "DELETE"
        )
    }
    
    func testConnection(server: ServerRequest) -> AnyPublisher<EmptyResponse, Error> {
        let body: [String: Any] = [
            "host": server.host,
            "port": server.port,
            "username": server.username,
            "password": server.password ?? "",
            "privateKey": server.privateKey ?? "",
            "authMethod": server.authMethod
        ]
        
        return apiService.request(
            endpoint: "/servers/test-connection",
            method: "POST",
            body: body
        )
    }
    
    func collectServerData(id: String) -> AnyPublisher<EmptyResponse, Error> {
        return apiService.request(
            endpoint: "/monitoring/collect-remote/\(id)",
            method: "POST"
        )
    }
    
    func getServerStats() -> AnyPublisher<ServerStats, Error> {
        return getServers()
            .map { servers in
                let total = servers.count
                let online = servers.filter { $0.status == .online }.count
                let warning = servers.filter { $0.status == .warning }.count
                let error = servers.filter { $0.status == .error }.count
                
                return ServerStats(
                    total: total,
                    online: online,
                    warning: warning,
                    error: error
                )
            }
            .eraseToAnyPublisher()
    }
}

struct ServerRequest {
    let name: String
    let host: String
    let port: Int
    let username: String
    let password: String?
    let privateKey: String?
    let os: String?
    let description: String?
    let authMethod: String
}