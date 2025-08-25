import Foundation
import Combine

class MonitoringService {
    private let apiService = ApiService()
    
    func getAllMonitoringData() -> AnyPublisher<[MonitoringData], Error> {
        return apiService.request(endpoint: "/monitoring")
            .map { (response: ApiResponse<[MonitoringData]>) in
                return response.data
            }
            .eraseToAnyPublisher()
    }
    
    func getServerMonitoringData(serverId: String) -> AnyPublisher<MonitoringData, Error> {
        return apiService.request(endpoint: "/monitoring/\(serverId)")
            .map { (response: ApiResponse<MonitoringData>) in
                return response.data
            }
            .eraseToAnyPublisher()
    }
    
    func getServerMonitoringHistory(serverId: String, period: String = "24h") -> AnyPublisher<[MonitoringData], Error> {
        return apiService.request(endpoint: "/monitoring/history/\(serverId)?period=\(period)")
            .map { (response: ApiResponse<[MonitoringData]>) in
                return response.data
            }
            .eraseToAnyPublisher()
    }
    
    func collectServerData(serverId: String) -> AnyPublisher<EmptyResponse, Error> {
        return apiService.request(
            endpoint: "/monitoring/collect-remote/\(serverId)",
            method: "POST"
        )
    }
}