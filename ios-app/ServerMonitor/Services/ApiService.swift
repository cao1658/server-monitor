import Foundation
import Combine

enum ApiError: Error {
    case invalidURL
    case requestFailed(Error)
    case decodingFailed(Error)
    case serverError(String)
    case unauthorized
    case unknown
}

class ApiService {
    private let baseURL = "http://localhost:5000/api"
    
    func request<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: [String: Any]? = nil
    ) -> AnyPublisher<T, Error> {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            return Fail(error: ApiError.invalidURL).eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // 添加认证令牌
        if let token = UserDefaults.standard.string(forKey: "authToken") {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // 添加请求体
        if let body = body {
            do {
                request.httpBody = try JSONSerialization.data(withJSONObject: body)
            } catch {
                return Fail(error: error).eraseToAnyPublisher()
            }
        }
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .tryMap { data, response in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw ApiError.unknown
                }
                
                if httpResponse.statusCode == 401 {
                    throw ApiError.unauthorized
                }
                
                if httpResponse.statusCode < 200 || httpResponse.statusCode >= 300 {
                    // 尝试解析错误消息
                    if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                        throw ApiError.serverError(errorResponse.error)
                    } else {
                        throw ApiError.serverError("服务器错误 (状态码: \(httpResponse.statusCode))")
                    }
                }
                
                return data
            }
            .decode(type: T.self, decoder: JSONDecoder())
            .mapError { error in
                if let apiError = error as? ApiError {
                    return apiError
                } else if let decodingError = error as? DecodingError {
                    return ApiError.decodingFailed(decodingError)
                } else {
                    return ApiError.requestFailed(error)
                }
            }
            .eraseToAnyPublisher()
    }
}

struct ErrorResponse: Codable {
    let success: Bool
    let error: String
}

struct ApiResponse<T: Codable>: Codable {
    let success: Bool
    let data: T
}