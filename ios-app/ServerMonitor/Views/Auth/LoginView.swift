import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var rememberMe = false
    @State private var showRegister = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // 背景
                LinearGradient(
                    gradient: Gradient(colors: [Color.blue.opacity(0.7), Color.purple.opacity(0.7)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                // 内容
                VStack {
                    // 标题
                    VStack(spacing: 10) {
                        Image(systemName: "server.rack")
                            .font(.system(size: 60))
                            .foregroundColor(.white)
                        
                        Text("服务器监控系统")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text("随时随地监控您的服务器")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .padding(.bottom, 40)
                    
                    // 登录表单
                    VStack(spacing: 20) {
                        // 邮箱输入框
                        VStack(alignment: .leading, spacing: 8) {
                            Text("邮箱")
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            HStack {
                                Image(systemName: "envelope")
                                    .foregroundColor(.white)
                                
                                TextField("请输入邮箱", text: $email)
                                    .keyboardType(.emailAddress)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                            }
                            .padding()
                            .background(Color.white.opacity(0.2))
                            .cornerRadius(10)
                        }
                        
                        // 密码输入框
                        VStack(alignment: .leading, spacing: 8) {
                            Text("密码")
                                .font(.headline)
                                .foregroundColor(.white)
                            
                            HStack {
                                Image(systemName: "lock")
                                    .foregroundColor(.white)
                                
                                if showPassword {
                                    TextField("请输入密码", text: $password)
                                } else {
                                    SecureField("请输入密码", text: $password)
                                }
                                
                                Button(action: {
                                    showPassword.toggle()
                                }) {
                                    Image(systemName: showPassword ? "eye.slash" : "eye")
                                        .foregroundColor(.white)
                                }
                            }
                            .padding()
                            .background(Color.white.opacity(0.2))
                            .cornerRadius(10)
                        }
                        
                        // 记住我和忘记密码
                        HStack {
                            Toggle("记住我", isOn: $rememberMe)
                                .foregroundColor(.white)
                                .toggleStyle(SwitchToggleStyle(tint: .blue))
                            
                            Spacer()
                            
                            Button("忘记密码?") {
                                // 忘记密码逻辑
                            }
                            .foregroundColor(.white)
                        }
                        
                        // 登录按钮
                        Button(action: {
                            authViewModel.login(email: email, password: password)
                        }) {
                            HStack {
                                if authViewModel.isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .padding(.trailing, 5)
                                }
                                
                                Text("登录")
                                    .fontWeight(.bold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                        }
                        .disabled(authViewModel.isLoading)
                        
                        // 注册链接
                        HStack {
                            Text("还没有账号?")
                                .foregroundColor(.white)
                            
                            Button("立即注册") {
                                showRegister = true
                            }
                            .foregroundColor(.white)
                            .fontWeight(.bold)
                        }
                    }
                    .padding(.horizontal, 30)
                    
                    Spacer()
                }
                .padding(.top, 50)
            }
            .alert(isPresented: Binding<Bool>(
                get: { authViewModel.error != nil },
                set: { if !$0 { authViewModel.error = nil } }
            )) {
                Alert(
                    title: Text("登录失败"),
                    message: Text(authViewModel.error ?? "未知错误"),
                    dismissButton: .default(Text("确定"))
                )
            }
            .sheet(isPresented: $showRegister) {
                RegisterView()
                    .environmentObject(authViewModel)
            }
        }
    }
}

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView()
            .environmentObject(AuthViewModel())
    }
}