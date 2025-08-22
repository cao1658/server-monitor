// 认证页面JavaScript
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.initPasswordToggle();
        this.initFormValidation();
    }

    // 绑定事件
    bindEvents() {
        // 表单切换
        document.getElementById('showRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // 表单提交
        document.getElementById('loginFormElement')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerFormElement')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
        
        // 忘记密码链接
        document.querySelector('.forgot-password')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showForgotPasswordModal();
        });
        
        // 忘记密码表单提交
        document.getElementById('forgotPasswordForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleForgotPassword();
        });
    }

    // 显示注册表单
    showRegisterForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        loginForm.classList.add('animate__fadeOut');
        
        setTimeout(() => {
            loginForm.classList.remove('active', 'animate__fadeOut');
            registerForm.classList.add('active');
            registerForm.classList.add('animate__fadeIn');
            
            setTimeout(() => {
                registerForm.classList.remove('animate__fadeIn');
            }, 500);
        }, 300);
    }

    // 显示登录表单
    showLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        registerForm.classList.add('animate__fadeOut');
        
        setTimeout(() => {
            registerForm.classList.remove('active', 'animate__fadeOut');
            loginForm.classList.add('active');
            loginForm.classList.add('animate__fadeIn');
            
            setTimeout(() => {
                loginForm.classList.remove('animate__fadeIn');
            }, 500);
        }, 300);
    }

    // 初始化密码显示/隐藏功能
    initPasswordToggle() {
        const toggleButtons = [
            'toggleLoginPassword',
            'toggleRegisterPassword',
            'toggleConfirmPassword'
        ];

        toggleButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    const input = button.parentElement.querySelector('input');
                    const icon = button.querySelector('i');
                    
                    if (input.type === 'password') {
                        input.type = 'text';
                        icon.classList.remove('bi-eye');
                        icon.classList.add('bi-eye-slash');
                    } else {
                        input.type = 'password';
                        icon.classList.remove('bi-eye-slash');
                        icon.classList.add('bi-eye');
                    }
                });
            }
        });
    }

    // 初始化表单验证
    initFormValidation() {
        // 实时验证用户名
        const registerUsername = document.getElementById('registerUsername');
        if (registerUsername) {
            registerUsername.addEventListener('input', () => {
                this.validateUsername(registerUsername.value, registerUsername);
            });
        }

        // 实时验证邮箱
        const registerEmail = document.getElementById('registerEmail');
        if (registerEmail) {
            registerEmail.addEventListener('input', () => {
                this.validateEmail(registerEmail.value, registerEmail);
            });
        }

        // 实时验证密码
        const registerPassword = document.getElementById('registerPassword');
        if (registerPassword) {
            registerPassword.addEventListener('input', () => {
                this.validatePassword(registerPassword.value, registerPassword);
                // 同时验证确认密码
                const confirmPassword = document.getElementById('confirmPassword');
                if (confirmPassword.value) {
                    this.validateConfirmPassword(confirmPassword.value, confirmPassword, registerPassword.value);
                }
            });
        }

        // 实时验证确认密码
        const confirmPassword = document.getElementById('confirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                const password = document.getElementById('registerPassword').value;
                this.validateConfirmPassword(confirmPassword.value, confirmPassword, password);
            });
        }
    }

    // 验证用户名
    validateUsername(username, element) {
        const isValid = username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username);
        this.setFieldValidation(element, isValid, isValid ? '用户名格式正确' : '用户名长度为3-20个字符，只能包含字母、数字、下划线和中文');
        return isValid;
    }

    // 验证邮箱
    validateEmail(email, element) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        this.setFieldValidation(element, isValid, isValid ? '邮箱格式正确' : '请输入有效的邮箱地址');
        return isValid;
    }

    // 验证密码
    validatePassword(password, element) {
        const isValid = password.length >= 8 && /(?=.*[a-zA-Z])(?=.*\d)/.test(password);
        this.setFieldValidation(element, isValid, isValid ? '密码强度良好' : '密码至少8位，包含字母和数字');
        return isValid;
    }

    // 验证确认密码
    validateConfirmPassword(confirmPassword, element, originalPassword) {
        const isValid = confirmPassword === originalPassword && confirmPassword.length > 0;
        this.setFieldValidation(element, isValid, isValid ? '密码确认正确' : '两次输入的密码不一致');
        return isValid;
    }

    // 设置字段验证状态
    setFieldValidation(element, isValid, message) {
        element.classList.remove('is-valid', 'is-invalid');
        
        // 移除现有的反馈信息
        const existingFeedback = element.parentElement.parentElement.querySelector('.valid-feedback, .invalid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        if (element.value.trim() !== '') {
            const feedbackDiv = document.createElement('div');
            feedbackDiv.textContent = message;
            
            if (isValid) {
                element.classList.add('is-valid');
                feedbackDiv.className = 'valid-feedback';
            } else {
                element.classList.add('is-invalid');
                feedbackDiv.className = 'invalid-feedback';
            }
            
            element.parentElement.parentElement.appendChild(feedbackDiv);
        }
    }

    // 处理登录
    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        if (!username || !password) {
            this.showToast('请填写完整的登录信息', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: username, // 后端期望的是email字段
                    password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showToast('登录成功！', 'success');
                
                // 保存token (后端返回的是 accessToken 和 refreshToken)
                localStorage.setItem('authToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('user', JSON.stringify(data.user));

                // 跳转到主页面
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                this.showToast(data.error || '登录失败', 'error');
            }
        } catch (error) {
            console.error('登录错误:', error);
            this.showToast('网络错误，请稍后重试', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // 处理注册
    async handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // 验证所有字段
        const isUsernameValid = this.validateUsername(username, document.getElementById('registerUsername'));
        const isEmailValid = this.validateEmail(email, document.getElementById('registerEmail'));
        const isPasswordValid = this.validatePassword(password, document.getElementById('registerPassword'));
        const isConfirmPasswordValid = this.validateConfirmPassword(confirmPassword, document.getElementById('confirmPassword'), password);

        if (!isUsernameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
            this.showToast('请检查并修正表单中的错误', 'error');
            return;
        }

        if (!agreeTerms) {
            this.showToast('请同意服务条款和隐私政策', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: username, // 后端期望的是name字段
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showToast('注册成功！请登录', 'success');
                
                // 清空注册表单
                document.getElementById('registerFormElement').reset();
                
                // 切换到登录表单
                setTimeout(() => {
                    this.showLoginForm();
                }, 1500);
            } else {
                this.showToast(data.error || '注册失败', 'error');
            }
        } catch (error) {
            console.error('注册错误:', error);
            this.showToast('网络错误，请稍后重试', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // 显示/隐藏加载状态
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    // 显示忘记密码模态框
    showForgotPasswordModal() {
        // 重置表单
        document.getElementById('forgotPasswordForm')?.reset();
        document.getElementById('resetSuccess')?.classList.add('d-none');
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
        modal.show();
    }
    
    // 处理忘记密码请求
    async handleForgotPassword() {
        const email = document.getElementById('resetEmail').value.trim();
        
        // 验证邮箱
        if (!this.validateEmail(email, document.getElementById('resetEmail'))) {
            this.showToast('请输入有效的邮箱地址', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            // 发送重置密码请求
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // 显示成功信息
                document.getElementById('resetSuccess').classList.remove('d-none');
                document.getElementById('forgotPasswordForm').classList.add('d-none');
                
                // 3秒后关闭模态框
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
                    if (modal) {
                        modal.hide();
                        
                        // 重置表单状态
                        setTimeout(() => {
                            document.getElementById('forgotPasswordForm').classList.remove('d-none');
                            document.getElementById('resetSuccess').classList.add('d-none');
                        }, 500);
                    }
                }, 3000);
                
                this.showToast('重置链接已发送到您的邮箱', 'success');
            } else {
                this.showToast(data.error || '发送重置链接失败', 'error');
            }
        } catch (error) {
            console.error('忘记密码错误:', error);
            this.showToast('网络错误，请稍后重试', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // 显示Toast通知
    showToast(message, type = 'info') {
        const toast = document.getElementById('authToast');
        const toastMessage = document.getElementById('toastMessage');
        const toastHeader = toast.querySelector('.toast-header');
        
        // 设置消息内容
        toastMessage.textContent = message;
        
        // 设置图标和颜色
        const icon = toastHeader.querySelector('i');
        icon.className = 'bi me-2';
        
        switch (type) {
            case 'success':
                icon.classList.add('bi-check-circle-fill', 'text-success');
                break;
            case 'error':
                icon.classList.add('bi-exclamation-circle-fill', 'text-danger');
                break;
            case 'warning':
                icon.classList.add('bi-exclamation-triangle-fill', 'text-warning');
                break;
            default:
                icon.classList.add('bi-info-circle-fill', 'text-primary');
        }
        
        // 设置时间
        const timeElement = toast.querySelector('.toast-header small');
        if (timeElement) {
            timeElement.textContent = '刚刚';
        }
        
        // 添加动画效果
        toast.classList.add('animate__animated', 'animate__fadeInRight');
        
        // 显示Toast
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 3000
        });
        bsToast.show();
        
        // 动画结束后移除类
        toast.addEventListener('hidden.bs.toast', function () {
            toast.classList.remove('animate__animated', 'animate__fadeInRight');
        }, { once: true });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});

// 检查是否已登录
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    
    // 如果在登录页面已有有效token，则跳转到主页
    if (token && window.location.pathname.includes('auth.html')) {
        // 简单检查token是否存在，不进行后端验证
        // 因为后端没有提供verify接口，实际验证会在访问受保护资源时进行
        window.location.href = '/';
    }
}

// 页面加载时检查登录状态
checkAuthStatus();