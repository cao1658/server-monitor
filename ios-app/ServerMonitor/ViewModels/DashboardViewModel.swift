import Foundation
import Combine

class DashboardViewModel: ObservableObject {
    @Published var serverStats: ServerStats?
    @Published var monitoringData: [String: MonitoringData] = [:]
    @Published var isLoading = false
    @Published var error: String?
    
    private let serverService = ServerService()
    private let monitoringService = MonitoringService()
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        loadDashboardData()
    }
    
    func loadDashboardData() {
        isLoading = true
        error = nil
        
        // 并行加载服务器统计数据和监控数据
        Publishers.Zip(
            serverService.getServerStats(),
            monitoringService.getAllMonitoringData()
        )
        .receive(on: DispatchQueue.main)
        .sink { [weak self] completion in
            self?.isLoading = false
            if case .failure(let error) = completion {
                self?.error = error.localizedDescription
            }
        } receiveValue: { [weak self] stats, monitoring in
            self?.serverStats = stats
            
            // 将监控数据转换为以服务器ID为键的字典
            var monitoringDict = [String: MonitoringData]()
            for data in monitoring {
                monitoringDict[data.serverId] = data
            }
            self?.monitoringData = monitoringDict
        }
        .store(in: &cancellables)
    }
    
    func refreshData() {
        loadDashboardData()
    }
    
    // 获取CPU使用率的颜色
    func getCpuUsageColor(usage: Double) -> String {
        if usage < 70 {
            return "green"
        } else if usage < 90 {
            return "yellow"
        } else {
            return "red"
        }
    }
    
    // 获取内存使用率的颜色
    func getMemoryUsageColor(usage: Double) -> String {
        if usage < 70 {
            return "green"
        } else if usage < 90 {
            return "yellow"
        } else {
            return "red"
        }
    }
    
    // 获取磁盘使用率的颜色
    func getDiskUsageColor(usage: Double) -> String {
        if usage < 80 {
            return "green"
        } else if usage < 95 {
            return "yellow"
        } else {
            return "red"
        }
    }
}

// 服务器统计数据模型
struct ServerStats {
    let total: Int
    let online: Int
    let warning: Int
    let error: Int
}