import SwiftUI

@main
struct ServerMonitorApp: App {
    @StateObject private var authViewModel = AuthViewModel()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authViewModel)
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    
    var body: some View {
        if authViewModel.isAuthenticated {
            MainTabView()
        } else {
            LoginView()
        }
    }
}

struct MainTabView: View {
    @StateObject private var dashboardViewModel = DashboardViewModel()
    @StateObject private var serverListViewModel = ServerListViewModel()
    
    var body: some View {
        TabView {
            DashboardView()
                .environmentObject(dashboardViewModel)
                .tabItem {
                    Label("仪表盘", systemImage: "gauge")
                }
            
            ServerListView()
                .environmentObject(serverListViewModel)
                .tabItem {
                    Label("服务器", systemImage: "server.rack")
                }
            
            SettingsView()
                .tabItem {
                    Label("设置", systemImage: "gear")
                }
        }
    }
}