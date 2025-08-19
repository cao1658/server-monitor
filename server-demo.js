// 简化版服务器，用于CloudStudio部署演示
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 模拟数据
const mockServers = [
  {
    _id: '1',
    name: 'Web服务器01',
    host: '192.168.1.100',
    port: 22,
    status: 'online',
    os: 'Ubuntu 20.04',
    lastCheck: new Date(),
    createdAt: new Date('2024-01-15')
  },
  {
    _id: '2',
    name: '数据库服务器',
    host: '192.168.1.101',
    port: 22,
    status: 'warning',
    os: 'CentOS 8',
    lastCheck: new Date(),
    createdAt: new Date('2024-02-10')
  },
  {
    _id: '3',
    name: '应用服务器',
    host: '192.168.1.102',
    port: 22,
    status: 'error',
    os: 'Ubuntu 22.04',
    lastCheck: new Date(),
    createdAt: new Date('2024-03-05')
  },
  {
    _id: '4',
    name: '缓存服务器',
    host: '192.168.1.103',
    port: 22,
    status: 'online',
    os: 'Redis Server',
    lastCheck: new Date(),
    createdAt: new Date('2024-03-20')
  }
];

const mockMonitoring = [
  {
    server: '1',
    cpu: { usage: 25.5 },
    memory: { usagePercentage: 45.2 },
    disk: { usagePercentage: 68.7 },
    timestamp: new Date()
  },
  {
    server: '2',
    cpu: { usage: 78.3 },
    memory: { usagePercentage: 82.1 },
    disk: { usagePercentage: 55.4 },
    timestamp: new Date()
  },
  {
    server: '3',
    cpu: { usage: 95.2 },
    memory: { usagePercentage: 91.8 },
    disk: { usagePercentage: 88.9 },
    timestamp: new Date()
  },
  {
    server: '4',
    cpu: { usage: 15.8 },
    memory: { usagePercentage: 32.4 },
    disk: { usagePercentage: 42.1 },
    timestamp: new Date()
  }
];

const mockLogs = [
  {
    timestamp: new Date(),
    user: 'admin',
    action: '登录系统',
    ipAddress: '192.168.1.50',
    server: 'Web服务器01',
    status: 'success'
  },
  {
    timestamp: new Date(Date.now() - 3600000),
    user: 'admin',
    action: '添加服务器',
    ipAddress: '192.168.1.50',
    server: '数据库服务器',
    status: 'success'
  },
  {
    timestamp: new Date(Date.now() - 7200000),
    user: 'operator',
    action: '重启服务',
    ipAddress: '192.168.1.51',
    server: '应用服务器',
    status: 'success'
  },
  {
    timestamp: new Date(Date.now() - 10800000),
    user: 'admin',
    action: '更新配置',
    ipAddress: '192.168.1.50',
    server: 'Web服务器01',
    status: 'failed'
  }
];

// API路由
app.get('/api/servers', (req, res) => {
  res.json({
    success: true,
    data: mockServers
  });
});

app.get('/api/monitoring', (req, res) => {
  res.json({
    success: true,
    data: mockMonitoring
  });
});

app.get('/api/auth/verify', (req, res) => {
  res.json({ 
    success: true, 
    user: { 
      username: 'demo',
      email: 'demo@example.com',
      role: 'admin'
    } 
  });
});

app.get('/api/logs', (req, res) => {
  res.json({
    success: true,
    data: mockLogs
  });
});

app.post('/api/servers', (req, res) => {
  const newServer = {
    _id: String(mockServers.length + 1),
    ...req.body,
    status: 'online',
    lastCheck: new Date(),
    createdAt: new Date()
  };
  mockServers.push(newServer);
  
  res.json({
    success: true,
    message: '服务器添加成功',
    data: newServer
  });
});

app.post('/api/servers/test-connection', (req, res) => {
  // 模拟连接测试
  setTimeout(() => {
    res.json({
      success: true,
      message: '连接测试成功'
    });
  }, 1000);
});

app.delete('/api/servers/:id', (req, res) => {
  const serverId = req.params.id;
  const index = mockServers.findIndex(server => server._id === serverId);
  
  if (index !== -1) {
    mockServers.splice(index, 1);
    res.json({
      success: true,
      message: '服务器删除成功'
    });
  } else {
    res.status(404).json({
      success: false,
      message: '服务器不存在'
    });
  }
});

app.post('/api/monitoring/collect-remote/:id', (req, res) => {
  const serverId = req.params.id;
  
  // 模拟数据收集
  setTimeout(() => {
    // 更新监控数据
    const monitoringIndex = mockMonitoring.findIndex(m => m.server === serverId);
    if (monitoringIndex !== -1) {
      mockMonitoring[monitoringIndex] = {
        server: serverId,
        cpu: { usage: Math.random() * 100 },
        memory: { usagePercentage: Math.random() * 100 },
        disk: { usagePercentage: Math.random() * 100 },
        timestamp: new Date()
      };
    }
    
    res.json({
      success: true,
      message: '数据收集完成'
    });
  }, 2000);
});

// 默认路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404处理
app.use('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({
      success: false,
      message: 'API接口不存在'
    });
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器监控系统演示版已启动！`);
  console.log(`📱 访问地址: http://localhost:${PORT}`);
  console.log(`💡 这是一个演示版本，包含模拟数据`);
  console.log(`🎨 页面已经过美化，包含现代化设计元素`);
  console.log(`🌐 CloudStudio部署版本 - 无需数据库`);
});