import Foundation

struct MonitoringData: Identifiable, Codable {
    let id: String
    let serverId: String
    let timestamp: Date
    let cpu: CpuData
    let memory: MemoryData
    let disk: DiskData
    let network: NetworkData?
    let uptime: Double
    
    enum CodingKeys: String, CodingKey {
        case id = "_id"
        case serverId = "server"
        case timestamp
        case cpu
        case memory
        case disk
        case network
        case uptime
    }
}

struct CpuData: Codable {
    let usage: Double
    let cores: Int
    let model: String?
    let speed: Double?
    let temperature: Double?
    let loadAverage: [Double]?
}

struct MemoryData: Codable {
    let total: Double
    let used: Double
    let free: Double
    let usagePercentage: Double
    
    var totalFormatted: String {
        formatBytes(bytes: total)
    }
    
    var usedFormatted: String {
        formatBytes(bytes: used)
    }
    
    var freeFormatted: String {
        formatBytes(bytes: free)
    }
    
    private func formatBytes(bytes: Double) -> String {
        let units = ["B", "KB", "MB", "GB", "TB"]
        var value = bytes
        var unitIndex = 0
        
        while value > 1024 && unitIndex < units.count - 1 {
            value /= 1024
            unitIndex += 1
        }
        
        return String(format: "%.2f %@", value, units[unitIndex])
    }
}

struct DiskData: Codable {
    let total: Double
    let used: Double
    let free: Double
    let usagePercentage: Double
    let filesystems: [FilesystemData]?
    
    var totalFormatted: String {
        formatBytes(bytes: total)
    }
    
    var usedFormatted: String {
        formatBytes(bytes: used)
    }
    
    var freeFormatted: String {
        formatBytes(bytes: free)
    }
    
    private func formatBytes(bytes: Double) -> String {
        let units = ["B", "KB", "MB", "GB", "TB"]
        var value = bytes
        var unitIndex = 0
        
        while value > 1024 && unitIndex < units.count - 1 {
            value /= 1024
            unitIndex += 1
        }
        
        return String(format: "%.2f %@", value, units[unitIndex])
    }
}

struct FilesystemData: Codable {
    let fs: String
    let type: String
    let size: Double
    let used: Double
    let available: Double
    let usagePercentage: Double
    let mountpoint: String
}

struct NetworkData: Codable {
    let interfaces: [NetworkInterface]?
    let inbound: Double?
    let outbound: Double?
}

struct NetworkInterface: Codable {
    let name: String
    let ip: String?
    let mac: String?
    let type: String?
    let speed: Double?
    let operstate: String?
}