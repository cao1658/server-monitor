// 服务器监控系统主要JavaScript文件
class ServerMonitor {
  constructor() {
    this.serversList = [];
    this.currentPage = 'dashboard';
    this.init();
  }

  // 初始化应用
  init() {
    // 检查认证状态
    if (!this.checkAuth()) {
      return;
    }

    // 初始化事件监听器
    this.initEventListeners();
    
    // 加载初始数据
    this.loadDashboardData();
    
    // 设置定时刷新
    this.setupAutoRefresh();
  }

  // 检查用户认证状态
  checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      this.redirectToAuth();
      return false;
    }
    
    // 直接显示仪表盘，因为后端没有提供verify接口
    // 实际验证会在访问受保护资源时进行
    this.showDashboard();
    return true;
  }

  // 重定向到认证页面
  redirectToAuth() {
    window.location.href = '/auth.html';
  }

  // 初始化事件监听器
  initEventListeners() {
    // 侧边栏导航
    document.querySelectorAll('[data-page]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.closest('[data-page]').dataset.page;
        this.navigateTo(page);
      });
    });

    // 刷新按钮
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
      this.refreshCurrentPage();
    });

    // 退出登录
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      this.logout();
    });
    
    document.getElementById('logoutLink')?.addEventListener('click', () => {
      this.logout();
    });

    // 设置标签页切换
    document.querySelectorAll('#settingsTabs a').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchSettingsTab(e.target.dataset.tab);
      });
    });

    // 添加服务器模态框事件
    this.initAddServerModal();
  }

  // 初始化添加服务器模态框
  initAddServerModal() {
    // 认证方式切换
    document.querySelectorAll('input[name="authMethod"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const passwordAuth = document.getElementById('passwordAuth');
        const keyAuth = document.getElementById('keyAuth');
        
        if (e.target.value === 'password') {
          passwordAuth.classList.remove('d-none');
          keyAuth.classList.add('d-none');
          document.getElementById('serverPassword').required = true;
          document.getElementById('serverPrivateKey').required = false;
        } else {
          passwordAuth.classList.add('d-none');
          keyAuth.classList.remove('d-none');
          document.getElementById('serverPassword').required = false;
          document.getElementById('serverPrivateKey').required = true;
        }
      });
    });

    // 保存服务器按钮
    document.getElementById('saveServerBtn')?.addEventListener('click', () => {
      this.saveServer();
    });

    // 模态框关闭时重置表单
    document.getElementById('addServerModal')?.addEventListener('hidden.bs.modal', () => {
      this.resetAddServerForm();
    });
  }

  // 保存服务器
  async saveServer() {
    const form = document.getElementById('addServerForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const authMethod = document.querySelector('input[name="authMethod"]:checked').value;
    
    const serverData = {
      name: formData.get('serverName') || document.getElementById('serverName').value,
      host: formData.get('serverHost') || document.getElementById('serverHost').value,
      port: parseInt(document.getElementById('serverPort').value) || 22,
      username: document.getElementById('serverUsername').value,
      os: document.getElementById('serverOS').value || 'linux',
      authMethod: authMethod,
      description: document.getElementById('serverDescription').value
    };

    if (authMethod === 'password') {
      serverData.password = document.getElementById('serverPassword').value;
    } else {
      serverData.privateKey = document.getElementById('serverPrivateKey').value;
    }

    const testConnection = document.getElementById('testConnection').checked;

    try {
      // 显示加载状态
      const saveBtn = document.getElementById('saveServerBtn');
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>保存中...';
      saveBtn.disabled = true;

      // 如果需要测试连接
      if (testConnection) {
        await this.request('/api/servers/test-connection', {
          method: 'POST',
          body: serverData
        });
      }

      // 保存服务器
      const response = await this.request('/api/servers', {
        method: 'POST',
        body: serverData
      });

      if (response.success) {
        this.showNotification('成功', '服务器添加成功', 'success');
        
        // 关闭模态框
        const modal = bootstrap.Modal.getInstance(document.getElementById('addServerModal'));
        modal.hide();
        
        // 刷新服务器列表
        await this.loadServersData();
        if (this.currentPage === 'dashboard') {
          await this.loadDashboardData();
        }
      }
    } catch (error) {
      console.error('保存服务器失败:', error);
      this.showNotification('错误', error.message || '保存服务器失败', 'error');
    } finally {
      // 恢复按钮状态
      const saveBtn = document.getElementById('saveServerBtn');
      saveBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i>保存服务器';
      saveBtn.disabled = false;
    }
  }

  // 重置添加服务器表单
  resetAddServerForm() {
    const form = document.getElementById('addServerForm');
    form.reset();
    
    // 重置认证方式显示
    document.getElementById('passwordAuth').classList.remove('d-none');
    document.getElementById('keyAuth').classList.add('d-none');
    document.getElementById('serverPassword').required = true;
    document.getElementById('serverPrivateKey').required = false;
    
    // 重置端口默认值
    document.getElementById('serverPort').value = 22;
    
    // 重置测试连接选项
    document.getElementById('testConnection').checked = true;
  }

  // 页面导航
  navigateTo(page) {
    // 更新侧边栏活动状态
    document.querySelectorAll('#sidebar .nav-link').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

    // 隐藏所有页面
    document.querySelectorAll('.content-page').forEach(pageEl => {
      pageEl.classList.add('d-none');
    });

    // 显示目标页面
    const targetPage = document.getElementById(`${page}Page`);
    if (targetPage) {
      targetPage.classList.remove('d-none');
      this.currentPage = page;
      
      // 更新页面标题和面包屑
      this.updatePageHeader(page);
      
      // 加载页面特定数据
      this.loadPageData(page);
    }
  }

  // 更新页面标题和面包屑
  updatePageHeader(page) {
    const titles = {
      dashboard: '仪表盘',
      servers: '服务器管理',
      ssh: 'SSH终端',
      files: '文件管理',
      logs: '审计日志',
      users: '用户管理',
      settings: '设置'
    };
    
    const title = titles[page] || '未知页面';
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('breadcrumbTitle').textContent = title;
  }

  // 加载页面数据
  loadPageData(page) {
    switch (page) {
      case 'dashboard':
        this.loadDashboardData();
        break;
      case 'servers':
        this.loadServersData();
        break;
      case 'logs':
        this.loadLogsData();
        break;
      case 'users':
        // 使用用户管理器加载用户数据
        if (window.userManager) {
          window.userManager.loadUsers();
        }
        break;
      default:
        break;
    }
  }

  // 显示仪表盘
  showDashboard() {
    document.getElementById('sidebar').style.display = 'block';
    document.querySelector('main').style.display = 'block';
    this.navigateTo('dashboard');
  }

  // 加载仪表盘数据
  async loadDashboardData() {
    try {
      // 加载服务器列表
      const serversResponse = await this.request('/api/servers');
      this.serversList = serversResponse.data || [];
      
      // 更新统计数据
      this.updateDashboardStats();
      
      // 更新服务器状态表格
      this.updateServerStatusTable();
      
      // 初始化图表
      if (typeof Chart !== 'undefined') {
        this.initCharts();
      }
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
      this.showNotification('错误', '加载数据失败', 'error');
    }
  }

  // 更新仪表盘统计数据
  updateDashboardStats() {
    const stats = { total: 0, online: 0, warning: 0, error: 0 };
    
    this.serversList.forEach(server => {
      stats.total++;
      switch (server.status) {
        case 'online': stats.online++; break;
        case 'warning': stats.warning++; break;
        case 'error': stats.error++; break;
      }
    });

    document.getElementById('totalServers').textContent = stats.total;
    document.getElementById('onlineServers').textContent = stats.online;
    document.getElementById('warningServers').textContent = stats.warning;
    document.getElementById('errorServers').textContent = stats.error;
  }

  // 更新服务器状态表格
  async updateServerStatusTable() {
    const tableBody = document.getElementById('serverStatusTable');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (this.serversList.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="9" class="text-center">没有服务器数据</td></tr>';
      return;
    }

    // 获取所有服务器的最新监控数据
    let monitoringData = {};
    try {
      const monitoringResponse = await this.request('/api/monitoring');
      if (monitoringResponse.success && monitoringResponse.data) {
        monitoringResponse.data.forEach(data => {
          monitoringData[data.server] = data;
        });
      }
    } catch (error) {
      console.error('获取监控数据失败:', error);
    }

    this.serversList.forEach(server => {
      const monitoring = monitoringData[server._id];
      let statusClass = 'secondary';
      let statusText = '离线';
      
      switch (server.status) {
        case 'online': statusClass = 'success'; statusText = '在线'; break;
        case 'warning': statusClass = 'warning'; statusText = '警告'; break;
        case 'error': statusClass = 'danger'; statusText = '错误'; break;
        case 'offline': statusClass = 'secondary'; statusText = '离线'; break;
      }

      const lastCheck = server.lastCheck 
        ? new Date(server.lastCheck).toLocaleString() 
        : '从未';

      const row = document.createElement('tr');
      row.dataset.serverId = server._id;
      row.innerHTML = `
        <td><input type="checkbox" class="form-check-input"></td>
        <td>
          <div class="d-flex align-items-center">
            <div class="bg-${statusClass} rounded-circle p-2 me-2">
              <i class="bi bi-hdd text-white small"></i>
            </div>
            <span>${server.name}</span>
          </div>
        </td>
        <td>${server.host}</td>
        <td><span class="badge bg-${statusClass} rounded-pill">${statusText}</span></td>
        <td>
          ${monitoring ? `
            <div class="d-flex align-items-center">
              <div class="progress flex-grow-1" style="height: 6px;">
                <div class="progress-bar bg-${this.getCpuUsageClass(monitoring.cpu.usage)}" 
                     style="width: ${monitoring.cpu.usage}%" 
                     aria-valuenow="${monitoring.cpu.usage}">
                </div>
              </div>
              <span class="ms-2">${monitoring.cpu.usage.toFixed(1)}%</span>
            </div>
          ` : '<span class="text-muted">无数据</span>'}
        </td>
        <td>
          ${monitoring ? `
            <div class="d-flex align-items-center">
              <div class="progress flex-grow-1" style="height: 6px;">
                <div class="progress-bar bg-${this.getMemoryUsageClass(monitoring.memory.usagePercentage)}" 
                     style="width: ${monitoring.memory.usagePercentage}%">
                </div>
              </div>
              <span class="ms-2">${monitoring.memory.usagePercentage.toFixed(1)}%</span>
            </div>
          ` : '<span class="text-muted">无数据</span>'}
        </td>
        <td>
          ${monitoring ? `
            <div class="d-flex align-items-center">
              <div class="progress flex-grow-1" style="height: 6px;">
                <div class="progress-bar bg-${this.getDiskUsageClass(monitoring.disk.usagePercentage)}" 
                     style="width: ${monitoring.disk.usagePercentage}%">
                </div>
              </div>
              <span class="ms-2">${monitoring.disk.usagePercentage.toFixed(1)}%</span>
            </div>
          ` : '<span class="text-muted">无数据</span>'}
        </td>
        <td>${lastCheck}</td>
        <td>
          <div class="dropdown">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
              操作
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="#" data-action="view"><i class="bi bi-eye me-2"></i>查看详情</a></li>
              <li><a class="dropdown-item" href="#" data-action="collect"><i class="bi bi-arrow-repeat me-2"></i>更新数据</a></li>
              <li><a class="dropdown-item" href="#" data-action="ssh"><i class="bi bi-terminal me-2"></i>SSH连接</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="#" data-action="delete"><i class="bi bi-trash me-2"></i>删除</a></li>
            </ul>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });
    
    // 初始化表格事件监听
    this.initServerTableEvents();
  }

  // 工具函数：获取CPU使用率颜色类
  getCpuUsageClass(usage) {
    return usage < 70 ? 'success' : (usage < 90 ? 'warning' : 'danger');
  }

  // 工具函数：获取内存使用率颜色类
  getMemoryUsageClass(usage) {
    return usage < 70 ? 'success' : (usage < 90 ? 'warning' : 'danger');
  }

  // 工具函数：获取磁盘使用率颜色类
  getDiskUsageClass(usage) {
    return usage < 80 ? 'success' : (usage < 95 ? 'warning' : 'danger');
  }

  // 初始化图表
  initCharts() {
    // 图表初始化逻辑在 chart.js 中实现
    if (window.chartUtils) {
      const stats = { total: 0, online: 0, warning: 0, error: 0 };
      this.serversList.forEach(server => {
        stats.total++;
        switch (server.status) {
          case 'online': stats.online++; break;
          case 'warning': stats.warning++; break;
          case 'error': stats.error++; break;
        }
      });
      
      window.chartUtils.updateDashboardStats(stats.total, stats.online, stats.warning, stats.error);
    }
  }

  // 加载服务器数据
  async loadServersData() {
    try {
      const response = await this.request('/api/servers');
      this.serversList = response.data || [];
      this.updateServersTable();
    } catch (error) {
      console.error('加载服务器数据失败:', error);
      this.showNotification('错误', '加载服务器数据失败', 'error');
    }
  }

  // 更新服务器表格
  updateServersTable() {
    const tableBody = document.getElementById('serversList');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (this.serversList.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="8" class="text-center">没有服务器数据</td></tr>';
      return;
    }
    
    this.serversList.forEach(server => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><input type="checkbox" class="form-check-input"></td>
        <td>${server.name}</td>
        <td>${server.host}</td>
        <td>${server.port || 22}</td>
        <td>${server.os || '未知'}</td>
        <td><span class="badge bg-${server.status === 'online' ? 'success' : 'secondary'}">${server.status === 'online' ? '在线' : '离线'}</span></td>
        <td>${new Date(server.createdAt).toLocaleDateString()}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" title="查看详情"><i class="bi bi-eye"></i></button>
            <button class="btn btn-outline-secondary" title="编辑"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-outline-danger" title="删除"><i class="bi bi-trash"></i></button>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  // 加载日志数据
  async loadLogsData() {
    try {
      const response = await this.request('/api/logs');
      this.updateLogsTable(response.data || []);
    } catch (error) {
      console.error('加载日志数据失败:', error);
      this.showNotification('错误', '加载日志数据失败', 'error');
    }
  }

  // 更新日志表格
  updateLogsTable(logs) {
    const tableBody = document.getElementById('logsList');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (logs.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" class="text-center">没有日志数据</td></tr>';
      return;
    }
    
    logs.forEach(log => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(log.timestamp).toLocaleString()}</td>
        <td>${log.user || '系统'}</td>
        <td>${log.action}</td>
        <td>${log.ipAddress || '-'}</td>
        <td>${log.server || '-'}</td>
        <td><span class="badge bg-${log.status === 'success' ? 'success' : 'danger'}">${log.status === 'success' ? '成功' : '失败'}</span></td>
        <td><button class="btn btn-sm btn-outline-primary">查看</button></td>
      `;
      tableBody.appendChild(row);
    });
  }

  // 设置标签页切换
  switchSettingsTab(tab) {
    // 更新标签页活动状态
    document.querySelectorAll('#settingsTabs a').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

    // 隐藏所有设置内容
    document.querySelectorAll('.settings-tab').forEach(content => {
      content.classList.add('d-none');
    });

    // 显示目标设置内容
    const targetContent = document.getElementById(`${tab}Settings`);
    if (targetContent) {
      targetContent.classList.remove('d-none');
    }
  }

  // 刷新当前页面
  refreshCurrentPage() {
    this.loadPageData(this.currentPage);
    this.showNotification('成功', '数据已刷新', 'success');
  }

  // 设置自动刷新
  setupAutoRefresh() {
    setInterval(() => {
      if (this.currentPage === 'dashboard') {
        this.loadDashboardData();
      }
    }, 30000); // 30秒刷新一次
  }

  // 退出登录
  async logout() {
    try {
      // 调用后端注销接口
      await this.request('/api/auth/logout', {
        method: 'POST'
      });
      
      // 清除本地存储的令牌和用户信息
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // 显示成功消息并重定向到登录页面
      this.showNotification('成功', '您已成功注销', 'success');
      setTimeout(() => {
        this.redirectToAuth();
      }, 1000);
    } catch (error) {
      console.error('注销失败:', error);
      // 即使后端请求失败，也清除本地存储并重定向
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      this.redirectToAuth();
    }
  }

  // 显示通知
  showNotification(title, message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');

    if (!toast || !toastTitle || !toastMessage) return;

    // 设置通知内容和样式
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toast.className = 'toast'; // 重置样式
    switch (type) {
      case 'error': toast.classList.add('bg-danger', 'text-white'); break;
      case 'warning': toast.classList.add('bg-warning'); break;
      case 'success': toast.classList.add('bg-success', 'text-white'); break;
      default: toast.classList.add('bg-info', 'text-white');
    }

    // 显示通知
    new bootstrap.Toast(toast).show();
  }

  // 通用请求函数（封装重复逻辑）
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

  // 加载服务器列表
  async loadServers() {
    try {
      const response = await this.request('/api/servers');
      this.serversList = response.data || [];
      return this.serversList;
    } catch (error) {
      console.error('加载服务器列表失败:', error);
      this.showNotification('错误', '加载服务器列表失败', 'error');
      return [];
    }
  }

  // 初始化服务器表格事件监听
  initServerTableEvents() {
    const tableBody = document.getElementById('serverStatusTable');
    if (!tableBody) return;

    // 使用事件委托处理操作按钮点击
    tableBody.addEventListener('click', async (e) => {
      const action = e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;

      const row = e.target.closest('tr');
      const serverId = row?.dataset.serverId;
      if (!serverId) return;

      e.preventDefault();

      switch (action) {
        case 'view':
          this.viewServerDetails(serverId);
          break;
        case 'collect':
          await this.collectServerData(serverId);
          break;
        case 'ssh':
          this.openSSHConnection(serverId);
          break;
        case 'delete':
          await this.deleteServer(serverId);
          break;
      }
    });

    // 处理复选框全选
    const selectAllCheckbox = document.querySelector('#serverStatusTable thead input[type="checkbox"]');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('#serverStatusTable tbody input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
          checkbox.checked = e.target.checked;
        });
      });
    }
  }

  // 页面特定功能（服务器管理相关）
  viewServerDetails(serverId) {
    console.log('查看服务器详情:', serverId);
    // TODO: 实现服务器详情模态框
  }

  // 打开SSH连接
  openSSHConnection(serverId) {
    console.log('打开SSH连接:', serverId);
    // TODO: 实现SSH连接功能
  }

  // 删除服务器
  async deleteServer(serverId) {
    if (!confirm('确定要删除这个服务器吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await this.request(`/api/servers/${serverId}`, 'DELETE');
      
      if (response.success) {
        this.showNotification('成功', '服务器删除成功', 'success');
        await this.loadDashboardData(); // 重新加载数据
      } else {
        this.showNotification('错误', response.message || '删除失败', 'error');
      }
    } catch (error) {
      console.error('删除服务器失败:', error);
      this.showNotification('错误', '删除失败', 'error');
    }
  }

  async collectServerData(serverId) {
    try {
      await this.request(`/api/monitoring/collect-remote/${serverId}`, 'POST');
      this.showNotification('成功', '数据收集已启动', 'success');
      setTimeout(() => this.loadDashboardData(), 2000);
    } catch (error) {
      this.showNotification('错误', error.message, 'error');
    }
  }

  // 显示警告信息
  showAlert(message, type = 'info') {
    this.showNotification(type === 'success' ? '成功' : '提示', message, type);
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.serverMonitor = new ServerMonitor();
});