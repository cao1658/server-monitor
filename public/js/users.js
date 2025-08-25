// 用户管理JavaScript
class UserManager {
    constructor() {
        this.usersList = [];
        this.currentUser = null;
        this.isEditMode = false;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    // 绑定事件
    bindEvents() {
        // 添加用户按钮
        document.querySelector('[data-bs-target="#addUserModal"]')?.addEventListener('click', () => {
            this.showAddUserModal();
        });

        // 保存用户按钮
        document.getElementById('saveUserBtn')?.addEventListener('click', () => {
            this.saveUser();
        });

        // 密码显示/隐藏切换
        document.getElementById('toggleUserPassword')?.addEventListener('click', () => {
            const passwordInput = document.getElementById('userPassword');
            const icon = document.querySelector('#toggleUserPassword i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
            }
        });

        // 用户表格中的操作按钮
        document.getElementById('usersList')?.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const userId = target.closest('tr').dataset.userId;
            
            if (target.classList.contains('btn-edit')) {
                this.editUser(userId);
            } else if (target.classList.contains('btn-delete')) {
                this.deleteUser(userId);
            }
        });

        // 全选复选框
        document.getElementById('selectAllUsers')?.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('#usersList input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
        });
    }

    // 显示添加用户模态框
    showAddUserModal() {
        this.isEditMode = false;
        document.getElementById('userModalTitle').textContent = '添加用户';
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = '';
        document.getElementById('userPassword').required = true;
        document.getElementById('passwordRequired').classList.remove('d-none');
        
        // 显示模态框
        const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
        modal.show();
    }

    // 显示编辑用户模态框
    async editUser(userId) {
        this.isEditMode = true;
        document.getElementById('userModalTitle').textContent = '编辑用户';
        document.getElementById('userId').value = userId;
        document.getElementById('userPassword').required = false;
        document.getElementById('passwordRequired').classList.add('d-none');
        
        try {
            // 获取用户信息
            const response = await this.request(`/api/users/${userId}`);
            if (response.success) {
                const user = response.data;
                document.getElementById('userName').value = user.name;
                document.getElementById('userEmail').value = user.email;
                document.getElementById('userRole').value = user.role;
                
                // 显示模态框
                const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
                modal.show();
            } else {
                this.showNotification('错误', '获取用户信息失败', 'error');
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
            this.showNotification('错误', '获取用户信息失败', 'error');
        }
    }

    // 保存用户
    async saveUser() {
        const form = document.getElementById('userForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const userId = document.getElementById('userId').value;
        const userData = {
            name: document.getElementById('userName').value,
            email: document.getElementById('userEmail').value,
            role: document.getElementById('userRole').value
        };

        // 如果是添加用户或者修改了密码，则包含密码字段
        const password = document.getElementById('userPassword').value;
        if (!this.isEditMode || password) {
            userData.password = password;
        }

        try {
            let response;
            if (this.isEditMode) {
                // 更新用户
                if (password) {
                    // 如果修改了密码，调用修改密码接口
                    await this.request(`/api/users/${userId}/change-password`, {
                        method: 'PUT',
                        body: { newPassword: password }
                    });
                }
                
                // 更新其他信息
                response = await this.request(`/api/users/${userId}`, {
                    method: 'PUT',
                    body: userData
                });
            } else {
                // 创建用户
                response = await this.request('/api/users', {
                    method: 'POST',
                    body: userData
                });
            }

            if (response.success) {
                this.showNotification('成功', this.isEditMode ? '用户更新成功' : '用户创建成功', 'success');
                
                // 关闭模态框
                const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
                modal.hide();
                
                // 刷新用户列表
                await this.loadUsers();
            } else {
                this.showNotification('错误', response.error || '操作失败', 'error');
            }
        } catch (error) {
            console.error('保存用户失败:', error);
            this.showNotification('错误', error.message || '保存用户失败', 'error');
        }
    }

    // 删除用户
    async deleteUser(userId) {
        if (!confirm('确定要删除这个用户吗？此操作不可恢复。')) {
            return;
        }

        try {
            const response = await this.request(`/api/users/${userId}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                this.showNotification('成功', '用户删除成功', 'success');
                await this.loadUsers();
            } else {
                this.showNotification('错误', response.error || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除用户失败:', error);
            this.showNotification('错误', '删除用户失败', 'error');
        }
    }

    // 加载用户列表
    async loadUsers() {
        try {
            const response = await this.request('/api/users');
            if (response.success) {
                this.usersList = response.data || [];
                this.renderUsersList();
            } else {
                this.showNotification('错误', '加载用户列表失败', 'error');
            }
        } catch (error) {
            console.error('加载用户列表失败:', error);
            this.showNotification('错误', '加载用户列表失败', 'error');
        }
    }

    // 渲染用户列表
    renderUsersList() {
        const tableBody = document.getElementById('usersList');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (this.usersList.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">没有用户数据</td></tr>';
            return;
        }
        
        this.usersList.forEach(user => {
            const row = document.createElement('tr');
            row.dataset.userId = user._id;
            
            // 获取当前登录用户
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const isCurrentUser = currentUser.id === user._id;
            
            row.innerHTML = `
                <td><input type="checkbox" class="form-check-input" ${isCurrentUser ? 'disabled' : ''}></td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="badge bg-${user.role === 'admin' ? 'primary' : 'secondary'}">${user.role === 'admin' ? '管理员' : '普通用户'}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary btn-edit" title="编辑"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-outline-danger btn-delete" title="删除" ${isCurrentUser ? 'disabled' : ''}><i class="bi bi-trash"></i></button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // 通用请求函数
    async request(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // 自动添加Token
                ...(localStorage.getItem('authToken') && {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                })
            }
        };

        const finalOptions = { ...defaultOptions, ...options };
        if (finalOptions.body && typeof finalOptions.body === 'object') {
            finalOptions.body = JSON.stringify(finalOptions.body);
        }

        try {
            const response = await fetch(url, finalOptions);
            const contentType = response.headers.get('content-type');
            const responseData = contentType?.includes('application/json')
                ? await response.json()
                : { message: await response.text() };

            if (!response.ok) {
                throw new Error(responseData.message || responseData.error || `请求失败（${response.status}）`);
            }
            return responseData;
        } catch (error) {
            console.error('请求失败:', error);
            throw error;
        }
    }

    // 显示通知
    showNotification(title, message, type = 'info') {
        // 使用主应用的通知系统
        if (window.serverMonitor) {
            window.serverMonitor.showNotification(title, message, type);
        } else {
            alert(`${title}: ${message}`);
        }
    }
}

// 导出用户管理器
window.userManager = new UserManager();