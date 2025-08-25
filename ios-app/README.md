# 服务器监控系统 - iOS应用

这是服务器监控系统的iOS客户端应用，使用Swift和SwiftUI开发。

## 功能

- 用户认证（登录/注册）
- 服务器状态监控
- 实时数据更新
- 推送通知
- 服务器管理操作

## 项目结构

```
ServerMonitor/
├── App/
│   ├── ServerMonitorApp.swift       # 应用入口
│   └── AppDelegate.swift            # 应用代理
├── Views/
│   ├── Auth/                        # 认证相关视图
│   │   ├── LoginView.swift
│   │   └── RegisterView.swift
│   ├── Dashboard/                   # 仪表盘视图
│   │   ├── DashboardView.swift
│   │   └── ServerStatusCard.swift
│   ├── Servers/                     # 服务器管理视图
│   │   ├── ServerListView.swift
│   │   └── ServerDetailView.swift
│   ├── Settings/                    # 设置视图
│   │   └── SettingsView.swift
│   └── Common/                      # 通用组件
│       ├── LoadingView.swift
│       └── ErrorView.swift
├── ViewModels/                      # 视图模型
│   ├── AuthViewModel.swift
│   ├── DashboardViewModel.swift
│   ├── ServerListViewModel.swift
│   └── ServerDetailViewModel.swift
├── Models/                          # 数据模型
│   ├── User.swift
│   ├── Server.swift
│   ├── MonitoringData.swift
│   └── ApiResponse.swift
├── Services/                        # 服务层
│   ├── ApiService.swift             # API通信服务
│   ├── AuthService.swift            # 认证服务
│   ├── ServerService.swift          # 服务器管理服务
│   └── NotificationService.swift    # 通知服务
└── Utils/                           # 工具类
    ├── Constants.swift
    ├── Extensions.swift
    └── Helpers.swift
```

## 开发环境要求

- Xcode 14.0+
- iOS 15.0+
- Swift 5.7+

## 安装与运行

1. 克隆仓库
2. 打开 `ServerMonitor.xcodeproj`
3. 配置开发团队和证书
4. 构建并运行应用

## API配置

在 `Utils/Constants.swift` 中配置API端点：

```swift
struct ApiConstants {
    static let baseUrl = "https://your-server-monitor-api.com/api"
    static let authEndpoint = "\(baseUrl)/auth"
    static let serversEndpoint = "\(baseUrl)/servers"
    static let monitoringEndpoint = "\(baseUrl)/monitoring"
}