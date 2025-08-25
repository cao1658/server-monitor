import SwiftUI

struct RegisterView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Environment(\.presentationMode) var presentationMode
    
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var showPassword = false
    @State private var showConfirmPassword = false
    @State private var agreeTerms = false
    
    // 表单验证状态
    @State private var nameError: String?
    @State private var emailError: String?
    @State private var passwordError: String?
    @State private var confirmPasswordError: String?
    
    var body: some View {
        NavigationView {
            ZStack {
                // 背景
                LinearGradient(
                    gradient: Gradient(colors: [Color.purple.opacity(0.7), Color.blue.opacity(0.7)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                // 内容
                ScrollView {
                    VStack(spacing: 25) {
                        // 标题
                        VStack(spacing: 10) {
                            Image(systemName: "person.badge.plus")
                                .font(.system(size: 50))
                                .foregroundColor(.white)
                            
                            Text("创建账户")
                                .font(.largeTitle)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                            
                            Text("加入服务器监控系统")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.8))
                        }
                        .padding(.top, 20)
                        .padding(.bottom, 30)
                        
                        // 注册表单
                        VStack(spacing: 20) {
                            // 用户名输入框
                            FormField(
                                title: "用户名",
                                placeholder: "请输入用户名",
                                text: $name,
                                icon: "person",
                                error: $nameError,
                                onChange: validateName
                            )
                            
                            // 邮箱输入框
                            FormField(
                                title: "邮箱",
                                placeholder: "请输入邮箱",
                                text: $email,
                                icon: "envelope",
                                error: $emailError,
                                keyboardType: .emailAddress,
                                onChange: validateEmail
                            )
                            
                            // 密码输入框
                            PasswordField(
                                title: "密码",
                                placeholder: "请输入密码",
                                password: $password,
                                showPassword: $showPassword,
                                error: $passwordError,
                                onChange: validatePassword
                            )
                            
                            // 确认密码输入框
                            PasswordField(
                                title: "确认密码",
                                placeholder: "请再次输入密码",
                                password: $confirmPassword,
                                showPassword: $showConfirmPassword,
                                error: $confirmPasswordError,
                                onChange: validateConfirmPassword
                            )
                            
                            // 同意条款
                            HStack {
                                Toggle("", isOn: $agreeTerms)
                                    .toggleStyle(SwitchToggleStyle(tint: .blue))
                                    .labelsHidden()
                                
                                Text("我同意")
                                    .foregroundColor(.white)
                                
                                Button("服务条款") {
                                    // 显示服务条款
                                }
                                .foregroundColor(.white)
                                .fontWeight(.bold)
                                
                                Text("和")
                                    .foregroundColor(.white)
                                
                                Button("隐私政策") {
                                    // 显示隐私政策
                                }
                                .foregroundColor(.white)
                                .fontWeight(.bold)
                            }
                            
                            // 注册按钮
                            Button(action: {
                                register()
                            }) {
                                HStack {
                                    if authViewModel.isLoading {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                            .padding(.trailing, 5)
                                    }
                                    
                                    Text("注册")
                                        .fontWeight(.bold)
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(isFormValid ? Color.blue : Color.gray)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                            }
                            .disabled(!isFormValid || authViewModel.isLoading)
                            
                            // 返回登录
                            HStack {
                                Text("已有账号?")
                                    .foregroundColor(.white)
                                
                                Button("返回登录") {
                                    presentationMode.wrappedValue.dismiss()
                                }
                                .foregroundColor(.white)
                                .fontWeight(.bold)
                            }
                        }
                        .padding(.horizontal, 30)
                    }
                    .padding(.bottom, 30)
                }
            }
            .navigationBarTitle("", displayMode: .inline)
            .navigationBarItems(leading: Button(action: {
                presentationMode.wrappedValue.dismiss()
            }) {
                Image(systemName: "xmark")
                    .foregroundColor(.white)
                    .padding(8)
                    .background(Color.white.opacity(0.2))
                    .clipShape(Circle())
            })
            .alert(isPresented: Binding<Bool>(
                get: { authViewModel.error != nil },
                set: { if !$0 { authViewModel.error = nil } }
            )) {
                Alert(
                    title: Text("注册失败"),
                    message: Text(authViewModel.error ?? "未知错误"),
                    dismissButton: .default(Text("确定"))
                )
            }
        }
    }
    
    // 表单验证
    private var isFormValid: Bool {
        return name.count >= 3 &&
               isValidEmail(email) &&
               password.count >= 8 &&
               password == confirmPassword &&
               agreeTerms
    }
    
    private func validateName() {
        if name.isEmpty {
            nameError = "请输入用户名"
        } else if name.count < 3 {
            nameError = "用户名至少需要3个字符"
        } else {
            nameError = nil
        }
    }
    
    private func validateEmail() {
        if email.isEmpty {
            emailError = "请输入邮箱"
        } else if !isValidEmail(email) {
            emailError = "请输入有效的邮箱地址"
        } else {
            emailError = nil
        }
    }
    
    private func validatePassword() {
        if password.isEmpty {
            passwordError = "请输入密码"
        } else if password.count < 8 {
            passwordError = "密码至少需要8个字符"
        } else if !containsLetterAndNumber(password) {
            passwordError = "密码需要包含字母和数字"
        } else {
            passwordError = nil
        }
        
        // 当密码改变时，也验证确认密码
        if !confirmPassword.isEmpty {
            validateConfirmPassword()
        }
    }
    
    private func validateConfirmPassword() {
        if confirmPassword.isEmpty {
            confirmPasswordError = "请确认密码"
        } else if confirmPassword != password {
            confirmPasswordError = "两次输入的密码不一致"
        } else {
            confirmPasswordError = nil
        }
    }
    
    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
    
    private func containsLetterAndNumber(_ text: String) -> Bool {
        let letterRegex = ".*[a-zA-Z]+.*"
        let numberRegex = ".*[0-9]+.*"
        let letterPredicate = NSPredicate(format: "SELF MATCHES %@", letterRegex)
        let numberPredicate = NSPredicate(format: "SELF MATCHES %@", numberRegex)
        return letterPredicate.evaluate(with: text) && numberPredicate.evaluate(with: text)
    }
    
    private func register() {
        authViewModel.register(name: name, email: email, password: password)
    }
}

// 表单字段组件
struct FormField: View {
    let title: String
    let placeholder: String
    @Binding var text: String
    let icon: String
    @Binding var error: String?
    var keyboardType: UIKeyboardType = .default
    var onChange: (() -> Void)?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .foregroundColor(.white)
            
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.white)
                
                TextField(placeholder, text: $text)
                    .keyboardType(keyboardType)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
                    .onChange(of: text) { _ in
                        onChange?()
                    }
            }
            .padding()
            .background(Color.white.opacity(0.2))
            .cornerRadius(10)
            
            if let error = error {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding(.leading, 4)
            }
        }
    }
}

// 密码字段组件
struct PasswordField: View {
    let title: String
    let placeholder: String
    @Binding var password: String
    @Binding var showPassword: Bool
    @Binding var error: String?
    var onChange: (() -> Void)?
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .foregroundColor(.white)
            
            HStack {
                Image(systemName: "lock")
                    .foregroundColor(.white)
                
                if showPassword {
                    TextField(placeholder, text: $password)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .onChange(of: password) { _ in
                            onChange?()
                        }
                } else {
                    SecureField(placeholder, text: $password)
                        .onChange(of: password) { _ in
                            onChange?()
                        }
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
            
            if let error = error {
                Text(error)
                    .font(.caption)
                    .foregroundColor(.red)
                    .padding(.leading, 4)
            }
        }
    }
}

struct RegisterView_Previews: PreviewProvider {
    static var previews: some View {
        RegisterView()
            .environmentObject(AuthViewModel())
    }
}