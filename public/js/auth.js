// 认证页面JavaScript
class AuthManager {
    // API地址常量管理
    static API_ENDPOINTS = {
        login: '/api/auth/login',
        register: '/api/auth/register',
        verify: '/api/auth/verify'
    };

    constructor() {
        // 缓存DOM元素（修正loginEmail对应HTML中的loginUsername ID）
        this.forms = {
            login: document.getElementById('loginForm'),
            register: document.getElementById('registerForm'),
            loginElement: document.getElementById('loginFormElement'),
            registerElement: document.getElementById('registerFormElement')
        };
        
        this.elements = {
            loginEmail: document.getElementById('loginUsername'), // 匹配HTML中的ID
            loginPassword: document.getElementById('loginPassword'),
            rememberMe: document.getElementById('rememberMe'),
            registerUsername: document.getElementById('registerUsername'),
            registerEmail: document.getElementById('registerEmail'),
            registerPassword: document.getElementById('registerPassword'),
            confirmPassword: document.getElementById('confirmPassword'),
            agreeTerms: document.getElementById('agreeTerms'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            authToast: document.getElementById('authToast'),
            toastMessage: document.getElementById('toastMessage')
        };

        this.buttons = {
            showRegister: document.getElementById('showRegister'),
            showLogin: document.getElementById('showLogin'),
            toggleLoginPassword: document.getElementById('toggleLoginPassword'),
            toggleRegisterPassword: document.getElementById('toggleRegisterPassword'),
            toggleConfirmPassword: document.getElementById('toggleConfirmPassword')
        };

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
        this.buttons.showRegister?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        this.buttons.showLogin?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // 表单提交
        this.forms.loginElement?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        this.forms.registerElement?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    }

    // 通用表单切换方法
    showForm(targetForm, otherForm) {
        if (!targetForm || !otherForm) return;
        
        otherForm.classList.add('animate__fadeOut');
        
        setTimeout(() => {
            otherForm.classList.remove('active', 'animate__fadeOut');
            targetForm.classList.add('active', 'animate__fadeIn');
            
            setTimeout(() => {
                targetForm.classList.remove('animate__fadeIn');
            }, 500);
        }, 300);
    }

    // 显示注册表单
    showRegisterForm() {
        this.showForm(this.forms.register, this.forms.login);
    }

    // 显示登录表单
    showLoginForm() {
        this.showForm(this.forms.login, this.forms.register);
    }

    // 初始化密码显示/隐藏功能
    initPasswordToggle() {
        Object.values(this.buttons).forEach(button => {
            if (button && button.id.includes('toggle') && button.id.includes('Password')) {
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
        // 登录表单验证
        this.elements.loginEmail?.addEventListener('input', () => {
            this.validateEmail(this.elements.loginEmail.value, this.elements.loginEmail);
        });

        this.elements.loginPassword?.addEventListener('input', () => {
            this.validatePassword(this.elements.loginPassword.value, this.elements.loginPassword);
        });

        // 注册表单验证
        this.elements.registerUsername?.addEventListener('input', () => {
            this.validateUsername(
                this.elements.registerUsername.value, 
                this.elements.registerUsername
            );
        });

        this.elements.registerEmail?.addEventListener('input', () => {
            this.validateEmail(
                this.elements.registerEmail.value, 
                this.elements.registerEmail
            );
        });

        this.elements.registerPassword?.addEventListener('input', () => {
            this.validatePassword(
                this.elements.registerPassword.value, 
                this.elements.registerPassword
            );
            // 同时验证确认密码
            if (this.elements.confirmPassword.value) {
                this.validateConfirmPassword(
                    this.elements.confirmPassword.value, 
                    this.elements.confirmPassword, 
                    this.elements.registerPassword.value
                );
            }
        });

        this.elements.confirmPassword?.addEventListener('input', () => {
            this.validateConfirmPassword(
                this.elements.confirmPassword.value, 
                this.elements.confirmPassword, 
                this.elements.registerPassword.value
            );
        });
    }

    // 验证用户名
    validateUsername(username, element) {
        const isValid = username.length >= 3 && username.length <= 20 && 
                       /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username);
        this.setFieldValidation(
            element, 
            isValid, 
            isValid ? '用户名格式正确' : '用户名长度为3-20个字符，只能包含字母、数字、下划线和中文'
        );
        return isValid;
    }

    // 验证邮箱
    validateEmail(email, element) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        this.setFieldValidation(
            element, 
            isValid, 
            isValid ? '邮箱格式正确' : '请输入有效的邮箱地址'
        );
        return isValid;
    }

    // 验证密码
    validatePassword(password, element) {
        const isValid = password.length >= 8 && /(?=.*[a-zA-Z])(?=.*\d)/.test(password);
        this.setFieldValidation(
            element, 
            isValid, 
            isValid ? '密码强度良好' : '密码至少8位，包含字母和数字'
        );
        return isValid;
    }

    // 验证确认密码
    validateConfirmPassword(confirmPassword, element, originalPassword) {
        const isValid = confirmPassword === originalPassword && confirmPassword.length > 0;
        this.setFieldValidation(
            element, 
            isValid, 
            isValid ? '密码确认正确' : '两次输入的密码不一致'
        );
        return isValid;
    }

    // 设置字段验证状态（优化版本）
    setFieldValidation(element, isValid, message) {
        if (!element) return;
        
        element.classList.remove('is-valid', 'is-invalid');
        
        // 获取预先定义的反馈元素
        const parent = element.parentElement.parentElement;
        let validFeedback = parent.querySelector('.valid-feedback');
        let invalidFeedback = parent.querySelector('.invalid-feedback');

        // 如果反馈元素不存在则创建
        if (!validFeedback) {
            validFeedback = document.createElement('div');
            validFeedback.className = 'valid-feedback';
            parent.appendChild(validFeedback);
        }
        
        if (!invalidFeedback) {
            invalidFeedback = document.createElement('div');
            invalidFeedback.className = 'invalid-feedback';
            parent.appendChild(invalidFeedback);
        }

        if (element.value.trim() !== '') {
            if (isValid) {
                element.classList.add('is-valid');
                validFeedback.textContent = message;
                validFeedback.style.display = 'block';
                invalidFeedback.style.display = 'none';
            } else {
                element.classList.add('is-invalid');
                invalidFeedback.textContent = message;
                invalidFeedback.style.display = 'block';
                validFeedback.style.display = 'none';
            }
        } else {
            validFeedback.style.display = 'none';
            invalidFeedback.style.display = 'none';
        }
    }

    // 处理登录
    async handleLogin() {
        const email = this.elements.loginEmail.value.trim();
        const password = this.elements.loginPassword.value;
        const rememberMe = this.elements.rememberMe?.checked;

        if (!email || !password) {
            this.showToast('请填写完整的登录信息', 'error');
            return;
        }

        // 验证登录字段
        const isEmailValid = this.validateEmail(email, this.elements.loginEmail);
        const isPasswordValid = this.validatePassword(password, this.elements.loginPassword);
        
        if (!isEmailValid || !isPasswordValid) {
            this.showToast('请检查并修正表单中的错误', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(AuthManager.API_ENDPOINTS.login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showToast('登录成功！', 'success');
                
                // 保存token
                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem('token', data.accessToken);
                storage.setItem('refreshToken', data.refreshToken);
                storage.setItem('user', JSON.stringify(data.user));

                // 跳转到主页面
                setTimeout(() => {
                    window.location.href = '/index.html';
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
        const name = this.elements.registerUsername.value.trim();
        const email = this.elements.registerEmail.value.trim();
        const password = this.elements.registerPassword.value;
        const confirmPassword = this.elements.confirmPassword.value;
        const agreeTerms = this.elements.agreeTerms?.checked;

        // 验证所有字段
        const isUsernameValid = this.validateUsername(username, this.elements.registerUsername);
        const isEmailValid = this.validateEmail(email, this.elements.registerEmail);
        const isPasswordValid = this.validatePassword(password, this.elements.registerPassword);
        const isConfirmPasswordValid = this.validateConfirmPassword(
            confirmPassword, 
            this.elements.confirmPassword, 
            password
        );

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
            const response = await fetch(AuthManager.API_ENDPOINTS.register, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: username,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.showToast('注册成功！请登录', 'success');
                
                // 清空注册表单
                this.forms.registerElement?.reset();
                
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
        if (this.elements.loadingOverlay) {
            if (show) {
                this.elements.loadingOverlay.classList.add('show');
            } else {
                this.elements.loadingOverlay.classList.remove('show');
            }
        }
    }

    // 显示Toast通知
    showToast(message, type = 'info') {
        if (!this.elements.authToast || !this.elements.toastMessage) return;
        
        const toast = this.elements.authToast;
        const toastMessage = this.elements.toastMessage;
        const toastHeader = toast.querySelector('.toast-header');
        
        // 设置消息内容
        toastMessage.textContent = message;
        
        // 设置图标和颜色
        const icon = toastHeader?.querySelector('i');
        if (icon) {
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
        }
        
        // 设置时间
        const timeElement = toastHeader?.querySelector('.toast-header small');
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
    // 修复token键名不一致的问题
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
        // 验证token有效性
        fetch(AuthManager.API_ENDPOINTS.verify, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                // 已登录，跳转到主页面
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('Token验证失败:', error);
        });
    }
}

// 页面加载时检查登录状态
checkAuthStatus();