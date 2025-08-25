import Foundation
import Combine

class ServerListViewModel: ObservableObject {
    @Published var servers: [Server] = []
    @Published var isLoading = false
    @Published var error: String?
    
    private let serverService = ServerService()
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        loadServers()
    }
    
    func loadServers() {
        isLoading = true
        error = nil
        
        serverService.getServers()
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = error.localizedDescription
                }
            } receiveValue: { [weak self] servers in
                self?.servers = servers
            }
            .store(in: &cancellables)
    }
    
    func refreshData() {
        loadServers()
    }
    
    func deleteServer(id: String) {
        isLoading = true
        error = nil
        
        serverService.deleteServer(id: id)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = error.localizedDescription
                }
            } receiveValue: { [weak self] _ in
                // 删除成功后重新加载服务器列表
                self?.loadServers()
            }
            .store(in: &cancellables)
    }
    
    func collectServerData(id: String) {
        isLoading = true
        error = nil
        
        serverService.collectServerData(id: id)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.error = error.localizedDescription
                }
            } receiveValue: { _ in
                // 数据收集已启动
            }
            .store(in: &cancellables)
    }
}