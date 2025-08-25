import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var dashboardViewModel: DashboardViewModel
    @State private var refreshing = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // 服务器统计卡片
                    if let stats = dashboardViewModel.serverStats {
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 16) {
                            StatCard(
                                title: "服务器总数",
                                value: "\(stats.total)",
                                icon: "server.rack",
                                color: .blue
                            )
                            
                            StatCard(
                                title: "在线服务器",
                                value: "\(stats.online)",
                                icon: "checkmark.circle",
                                color: .green
                            )
                            
                            StatCard(
                                title: "警告状态",
                                value: "\(stats.warning)",
                                icon: "exclamationmark.triangle",
                                color: .yellow
                            )
                            
                            StatCard(
                                title: "错误状态",
                                value: "\(stats.error)",
                                icon: "xmark.circle",
                                color: .red
                            )
                        }
                        .padding(.horizontal)
                    }
                    
                    // 服务器状态列表
                    VStack(alignment: .leading, spacing: 12) {
                        Text("服务器状态")
                            .font(.headline)
                            .padding(.horizontal)
                        
                        if dashboardViewModel.isLoading {
                            HStack {
                                Spacer()
                                ProgressView()
                                    .padding()
                                Spacer()
                            }
                        } else if let error = dashboardViewModel.error {
                            ErrorView(message: error) {
                                dashboardViewModel.refreshData()
                            }
                        } else if dashboardViewModel.serverStats?.total == 0 {
                            EmptyStateView(
                                title: "没有服务器",
                                message: "添加您的第一台服务器开始监控",
                                buttonTitle: "添加服务器"
                            ) {
                                // 导航到添加服务器页面
                            }
                        } else {
                            ForEach(dashboardViewModel.monitoringData.keys.sorted(), id: \.self) { serverId in
                                if let data = dashboardViewModel.monitoringData[serverId] {
                                    ServerStatusCard(data: data)
                                        .padding(.horizontal)
                                }
                            }
                        }
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("仪表盘")
            .navigationBarItems(trailing:
                Button(action: {
                    withAnimation {
                        refreshing = true
                        dashboardViewModel.refreshData()
                        
                        // 模拟刷新动画
                        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                            refreshing = false
                        }
                    }
                }) {
                    Image(systemName: refreshing ? "arrow.triangle.2.circlepath.circle.fill" : "arrow.triangle.2.circlepath")
                        .rotationEffect(Angle(degrees: refreshing ? 360 : 0))
                        .animation(refreshing ? Animation.linear(duration: 1).repeatForever(autoreverses: false) : .default, value: refreshing)
                }
            )
            .refreshable {
                dashboardViewModel.refreshData()
            }
        }
        .onAppear {
            if dashboardViewModel.serverStats == nil {
                dashboardViewModel.loadDashboardData()
            }
        }
    }
}

// 统计卡片组件
struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Image(systemName: icon)
                    .foregroundColor(color)
                    .padding(8)
                    .background(color.opacity(0.2))
                    .clipShape(Circle())
            }
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

// 服务器状态卡片
struct ServerStatusCard: View {
    let data: MonitoringData
    @State private var showDetails = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // 服务器名称和状态
            HStack {
                Text("服务器名称") // 实际应用中应该显示服务器名称
                    .font(.headline)
                
                Spacer()
                
                StatusBadge(status: .online) // 实际应用中应该使用服务器的真实状态
            }
            
            Divider()
            
            // 资源使用情况
            VStack(spacing: 12) {
                ResourceBar(
                    title: "CPU",
                    value: data.cpu.usage,
                    icon: "cpu",
                    color: getColorForUsage(data.cpu.usage)
                )
                
                ResourceBar(
                    title: "内存",
                    value: data.memory.usagePercentage,
                    icon: "memorychip",
                    color: getColorForUsage(data.memory.usagePercentage)
                )
                
                ResourceBar(
                    title: "磁盘",
                    value: data.disk.usagePercentage,
                    icon: "internaldrive",
                    color: getColorForUsage(data.disk.usagePercentage)
                )
            }
            
            // 查看详情按钮
            Button(action: {
                showDetails.toggle()
            }) {
                HStack {
                    Text("查看详情")
                    Spacer()
                    Image(systemName: "chevron.right")
                }
                .padding(.vertical, 8)
            }
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        .sheet(isPresented: $showDetails) {
            ServerDetailView(serverId: data.serverId)
        }
    }
    
    private func getColorForUsage(_ usage: Double) -> Color {
        if usage < 70 {
            return .green
        } else if usage < 90 {
            return .yellow
        } else {
            return .red
        }
    }
}

// 资源使用条
struct ResourceBar: View {
    let title: String
    let value: Double
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                
                Text(title)
                    .font(.subheadline)
                
                Spacer()
                
                Text("\(Int(value))%")
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 8)
                        .cornerRadius(4)
                    
                    Rectangle()
                        .fill(color)
                        .frame(width: min(CGFloat(value) / 100 * geometry.size.width, geometry.size.width), height: 8)
                        .cornerRadius(4)
                }
            }
            .frame(height: 8)
        }
    }
}

// 状态标签
struct StatusBadge: View {
    let status: ServerStatus
    
    var body: some View {
        Text(status.displayName)
            .font(.caption)
            .fontWeight(.medium)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(getStatusColor(status).opacity(0.2))
            .foregroundColor(getStatusColor(status))
            .cornerRadius(8)
    }
    
    private func getStatusColor(_ status: ServerStatus) -> Color {
        switch status {
        case .online: return .green
        case .offline: return .gray
        case .warning: return .yellow
        case .error: return .red
        }
    }
}

// 错误视图
struct ErrorView: View {
    let message: String
    let retryAction: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 50))
                .foregroundColor(.yellow)
            
            Text("出错了")
                .font(.title2)
                .fontWeight(.bold)
            
            Text(message)
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
            
            Button(action: retryAction) {
                Text("重试")
                    .fontWeight(.medium)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
    }
}

// 空状态视图
struct EmptyStateView: View {
    let title: String
    let message: String
    let buttonTitle: String
    let action: () -> Void
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "server.rack")
                .font(.system(size: 50))
                .foregroundColor(.blue)
            
            Text(title)
                .font(.title2)
                .fontWeight(.bold)
            
            Text(message)
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
            
            Button(action: action) {
                Text(buttonTitle)
                    .fontWeight(.medium)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(8)
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
    }
}

// 服务器详情视图（占位符）
struct ServerDetailView: View {
    let serverId: String
    
    var body: some View {
        Text("服务器详情: \(serverId)")
            .navigationTitle("服务器详情")
    }
}

struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView()
            .environmentObject(DashboardViewModel())
    }
}