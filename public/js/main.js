// 全局变量
let currentUser = null;
let currentPage = 'login';
let serversList = [];
let monitoringData = {};
let refreshInterval = null;

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 初始化事件监听器
  initEventListeners();
  
  // 检查用户是否已登录
  checkAuthStatus();
});

// 初始化事件监听器
function initEventListeners() {
  // 导航菜单点击事件
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.target.closest('.nav-link').dataset.page;
      navigateTo(page);
    });
  });
  
  // 登录表单提交
  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    login();
  });
  
  // 注册表单提交
  document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    register();
  });
  
  // 显示注册页面按钮
  document.getElementById('showRegisterBtn').addEventListener('click', () => {
    document.getElementById('loginPage').classList.add('d-none');
    document.getElementById('registerPage').classList.remove('d-none');
  });
  
  // 显示登录页面按钮
  document.getElementById('showLoginBtn').addEventListener('click', () => {
    document.getElementById('registerPage').classList.add('d-none');
    document.getElementById('loginPage').classList.remove('d-none');
  });
  
  // 退出登录按钮
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('logoutLink').addEventListener('click', logout);
  
  // 刷新按钮
  document.getElementById('refreshBtn').addEventListener('click', () => {
    refreshCurrentPage();
  });
}

// 检查用户是否已登录
async function checkAuthStatus() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    showAuthPages();
    return;
  }
  
  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      currentUser = data.data;
      showAppInterface();
      navigateTo('dashboard');
    } else {
      // Token无效或过期
      localStorage.removeItem('token');
      showAuthPages();
    }
  } catch (error) {
    console.error('检查认证状态出错:', error);
    showAuthPages();
  }
}

// 显示认证页面
function showAuthPages() {
  document.getElementById('sidebar').classList.add('d-none');
  document.getElementById('pageTitle').parentElement.classList.add('d-none');
  document.getElementById('loginPage').classList.remove('d-none');
  document.getElementById('dashboardPage').classList.add('d-none');
  
  // 清除可能的刷新间隔
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

// 显示应用界面
function showAppInterface() {
  document.getElementById('sidebar').classList.remove('d-none');
  document.getElementById('pageTitle').parentElement.classList.remove('d-none');
  document.getElementById('loginPage').classList.add('d-none');
  document.getElementById('registerPage').classList.add('d-none');
  
  // 设置用户名
  document.getElementById('username').textContent = currentUser.username;
  
  // 设置活动导航项
  setActiveNavItem('dashboard');
}

// 设置活动导航项
function setActiveNavItem(page) {
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.page === page) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// 导航到指定页面
function navigateTo(page) {
  currentPage = page;
  
  // 更新页面标题
  const pageTitles = {
    dashboard: '仪表盘',
    servers: '服务器管理',
    ssh: 'SSH终端',
    files: '文件管理',
    logs: '审计日志',
    settings: '设置',
    profile: '个人资料'
  };
  
  document.getElementById('pageTitle').textContent = pageTitles[page] || '页面';
  
  // 隐藏所有内容页
  document.querySelectorAll('.content-page').forEach(pageEl => {
    pageEl.classList.add('d-none');
  });
  
  // 显示当前页面
  const pageElement = document.getElementById(`${page}Page`);
  if (pageElement) {
    pageElement.classList.remove('d-none');
  }
  
  // 设置活动导航项
  setActiveNavItem(page);
  
  // 加载页面数据
  loadPageData(page);
  
  // 清除可能的刷新间隔
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  
  // 对于仪表盘，设置自动刷新
  if (page === 'dashboard') {
    refreshInterval = setInterval(() => {
      loadDashboardData();
    }, 30000); // 每30秒刷新一次
  }
}

// 加载页面数据
function loadPageData(page) {
  switch (page) {
    case 'dashboard':
      loadDashboardData();
      break;
    case 'servers':
      loadServersData();
      break;
    case 'ssh':
      loadSshInterface();
      break;
    case 'files':
      loadFilesInterface();
      break;
    case 'logs':
      loadLogsData();
      break;
    case 'settings':
      loadSettingsData();
      break;
    case 'profile':
      loadProfileData();
      break;
  }
}

// 刷新当前页面
function refreshCurrentPage() {
  loadPageData(currentPage);
  showNotification('刷新成功', '页面数据已更新');
}

// 加载仪表盘数据
async function loadDashboardData() {
  try {
    // 获取服务器列表
    const serversResponse = await fetch('/api/servers', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!serversResponse.ok) {
      throw new Error('获取服务器列表失败');
    }
    
    const serversData = await serversResponse.json();
    serversList = serversData.data;
    
    // 获取监控数据
    const monitoringResponse = await fetch('/api/monitoring', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!monitoringResponse.ok) {
      throw new Error('获取监控数据失败');
    }
    
    const monitoringResult = await monitoringResponse.json();
    monitoringData = {};
    
    // 将监控数据转换为以服务器ID为键的对象
    monitoringResult.data.forEach(item => {
      monitoringData[item.server] = item;
    });
    
    // 更新仪表盘统计数据
    updateDashboardStats();
    
    // 更新服务器状态表格
    updateServerStatusTable();
    
  } catch (error) {
    console.error('加载仪表盘数据出错:', error);
    showNotification('错误', '加载仪表盘数据失败', 'error');
  }
}

// 更新仪表盘统计数据
function updateDashboardStats() {
  // 计算各种状态的服务器数量
  const stats = {
    total: serversList.length,
    online: 0,
    warning: 0,
    error: 0
  };
  
  serversList.forEach(server => {
    switch (server.status) {
      case 'online':
        stats.online++;
        break;
      case 'warning':
        stats.warning++;
        break;
      case 'error':
        stats.error++;
        break;
    }
  });
  
  // 更新DOM
  document.getElementById('totalServers').textContent = stats.total;
  document.getElementById('onlineServers').textContent = stats.online;
  document.getElementById('warningServers').textContent = stats.warning;
  document.getElementById('errorServers').textContent = stats.error;
}

// 更新服务器状态表格
function updateServerStatusTable() {
  const tableBody = document.getElementById('serverStatusTable');
  tableBody.innerHTML = '';
  
  if (serversList.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="8" class="text-center">没有服务器数据</td>`;
    tableBody.appendChild(row);
    return;
  }
  
  serversList.forEach(server => {
    const monitoring = monitoringData[server._id];
    
    const row = document.createElement('tr');
    
    // 状态类和图标
    let statusClass = '';
    let statusText = '';
    
    switch (server.status) {
      case 'online':
        statusClass = 'success';
        statusText = '在线';
        break;
      case 'offline':
        statusClass = 'secondary';
        statusText = '离线';
        break;
      case 'warning':
        statusClass = 'warning';
        statusText = '警告';
        break;
      case 'error':
        statusClass = 'danger';
        statusText = '错误';
        break;
    }
    
    // 格式化最后检查时间
    const lastCheck = server.lastCheck ? new Date(server.lastCheck).toLocaleString() : '从未';
    
    row.innerHTML = `
      <td>${server.name}</td>
      <td>${server.host}</td>
      <td><span class="badge bg-${statusClass}">${statusText}</span></td>
      <td>
        ${monitoring ? `
          <div class="progress">
            <div class="progress-bar bg-${getCpuUsageClass(monitoring.cpu.usage)}" 
                 style="width: ${monitoring.cpu.usage}%" 
                 aria-valuenow="${monitoring.cpu.usage}" 
                 aria-valuemin="0" 
                 aria-valuemax="100">
            </div>
          </div>
          <small>${monitoring.cpu.usage.toFixed(1)}%</small>
        ` : '无数据'}
      </td>
      <td>
        ${monitoring ? `
          <div class="progress">
            <div class="progress-bar bg-${getMemoryUsageClass(monitoring.memory.usagePercentage)}" 
                 style="width: ${monitoring.memory.usagePercentage}%" 
                 aria-valuenow="${monitoring.memory.usagePercentage}" 
                 aria-valuemin="0" 
                 aria-valuemax="100">
            </div>
          </div>
          <small>${monitoring.memory.usagePercentage.toFixed(1)}%</small>
        ` : '无数据'}
      </td>
      <td>
        ${monitoring ? `
          <div class="progress">
            <div class="progress-bar bg-${getDiskUsageClass(monitoring.disk.usagePercentage)}" 
                 style="width: ${monitoring.disk.usagePercentage}%" 
                 aria-valuenow="${monitoring.disk.usagePercentage}" 
                 aria-valuemin="0" 
                 aria-valuemax="100">
            </div>
          </div>
          <small>${monitoring.disk.usagePercentage.toFixed(1)}%</small>
        ` : '无数据'}
      </td>
      <td>${lastCheck}</td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary" onclick="viewServerDetails('${server._id}')">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-outline-secondary" onclick="collectServerData('${server._id}')">
            <i class="bi bi-arrow-repeat"></i>
          </button>
          <button class="btn btn-outline-danger" onclick="deleteServer('${server._id}')">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// 获取CPU使用率的颜色类
function getCpuUsageClass(usage) {
  if (usage < 70) return 'success';
  if (usage < 90) return 'warning';
  return 'danger';
}

// 获取内存使用率的颜色类
function getMemoryUsageClass(usage) {
  if (usage < 80) return 'success';
  if (usage < 95) return 'warning';
  return 'danger';
}

// 获取磁盘使用率的颜色类
function getDiskUsageClass(usage) {
  if (usage < 85) return 'success';
  if (usage < 95) return 'warning';
  return 'danger';
}

// 登录
async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // 保存token
      localStorage.setItem('token', data.token);
      
      // 获取用户信息
      await checkAuthStatus();
      
      showNotification('登录成功', '欢迎回来！');
    } else {
      showNotification('登录失败', data.error, 'error');
    }
  } catch (error) {
    console.error('登录出错:', error);
    showNotification('错误', '登录过程中发生错误', 'error');
  }
}

// 注册
async function register() {
  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  
  // 验证密码
  if (password !== confirmPassword) {
    showNotification('错误', '两次输入的密码不一致', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // 保存token
      localStorage.setItem('token', data.token);
      
      // 获取用户信息
      await checkAuthStatus();
      
      showNotification('注册成功', '账号已创建！');
    } else {
      showNotification('注册失败', data.error, 'error');
    }
  } catch (error) {
    console.error('注册出错:', error);
    showNotification('错误', '注册过程中发生错误', 'error');
  }
}

// 退出登录
async function logout() {
  try {
    await fetch('/api/auth/logout', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    // 清除本地存储
    localStorage.removeItem('token');
    currentUser = null;
    
    // 显示登录页面
    showAuthPages();
    
    showNotification('退出成功', '您已安全退出系统');
  } catch (error) {
    console.error('退出登录出错:', error);
    
    // 即使请求失败，也清除本地存储并显示登录页面
    localStorage.removeItem('token');
    currentUser = null;
    showAuthPages();
  }
}

// 显示通知
function showNotification(title, message, type = 'info') {
  const toast = document.getElementById('notificationToast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMessage = document.getElementById('toastMessage');
  
  // 设置标题和消息
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  
  // 设置类型样式
  toast.className = 'toast';
  switch (type) {
    case 'error':
      toast.classList.add('bg-danger', 'text-white');
      break;
    case 'warning':
      toast.classList.add('bg-warning');
      break;
    case 'success':
      toast.classList.add('bg-success', 'text-white');
      break;
    default:
      toast.classList.add('bg-info', 'text-white');
  }
  
  // 显示通知
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
}

// 以下是页面特定的功能，可以根据需要实现
function loadServersData() {
  // 实现服务器管理页面的数据加载
  console.log('加载服务器管理页面数据');
}

function loadSshInterface() {
  // 实现SSH终端界面
  console.log('加载SSH终端界面');
}

function loadFilesInterface() {
  // 实现文件管理界面
  console.log('加载文件管理界面');
}

function loadLogsData() {
  // 实现审计日志页面的数据加载
  console.log('加载审计日志页面数据');
}

function loadSettingsData() {
  // 实现设置页面的数据加载
  console.log('加载设置页面数据');
}

function loadProfileData() {
  // 实现个人资料页面的数据加载
  console.log('加载个人资料页面数据');
}

// 查看服务器详情
function viewServerDetails(serverId) {
  console.log('查看服务器详情:', serverId);
  // 实现查看服务器详情的功能
}

// 收集服务器数据
async function collectServerData(serverId) {
  try {
    const response = await fetch(`/api/monitoring/collect-remote/${serverId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      showNotification('成功', '服务器数据已更新');
      loadDashboardData(); // 刷新数据
    } else {
      const data = await response.json();
      showNotification('失败', data.error, 'error');
    }
  } catch (error) {
    console.error('收集服务器数据出错:', error);
    showNotification('错误', '收集服务器数据过程中发生错误', 'error');
  }
}

// 删除服务器
async function deleteServer(serverId) {
  if (!confirm('确定要删除此服务器吗？此操作不可撤销。')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/servers/${serverId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      showNotification('成功', '服务器已删除');
      loadDashboardData(); // 刷新数据
    } else {
      const data = await response.json();
      showNotification('失败', data.error, 'error');
    }
  } catch (error) {
    console.error('删除服务器出错:', error);
    showNotification('错误', '删除服务器过程中发生错误', 'error');
  }
}