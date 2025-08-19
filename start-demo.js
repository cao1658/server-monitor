// 简单的演示服务器，用于预览美化后的页面
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// 静态文件服务
app.use(express.static('public'));

// 模拟API路由
app.get('/api/servers', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        _id: '1',
        name: 'Web服务器01',
        host: '192.168.1.100',
        port: 22,
        status: 'online',
        os: 'Ubuntu 20.04',
        lastCheck: new Date(),
        createdAt: new Date()
      },
      {
        _id: '2',
        name: '数据库服务器',
        host: '192.168.1.101',
        port: 22,
        status: 'warning',
        os: 'CentOS 8',
        lastCheck: new Date(),
        createdAt: new Date()
      },
      {
        _id: '3',
        name: '应用服务器',
        host: '192.168.1.102',
        port: 22,
        status: 'error',
        os: 'Ubuntu 22.04',
        lastCheck: new Date(),
        createdAt: new Date()
      }
    ]
  });
});

app.get('/api/monitoring', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        server: '1',
        cpu: { usage: 25.5 },
        memory: { usagePercentage: 45.2 },
        disk: { usagePercentage: 68.7 }
      },
      {
        server: '2',
        cpu: { usage: 78.3 },
        memory: { usagePercentage: 82.1 },
        disk: { usagePercentage: 55.4 }
      },
      {
        server: '3',
        cpu: { usage: 95.2 },
        memory: { usagePercentage: 91.8 },
        disk: { usagePercentage: 88.9 }
      }
    ]
  });
});

app.get('/api/auth/verify', (req, res) => {
  res.json({ success: true, user: { username: 'demo' } });
});

app.get('/api/logs', (req, res) => {
  res.json({
    success: true,
    data: [
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
      }
    ]
  });
});

// 默认路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 服务器监控系统演示服务器已启动！`);
  console.log(`📱 访问地址: http://localhost:${PORT}`);
  console.log(`💡 这是一个演示版本，包含模拟数据`);
  console.log(`🎨 页面已经过美化，包含现代化设计元素\n`);
});