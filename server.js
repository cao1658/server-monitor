require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();

// 配置trust proxy（根据实际代理层数设置）
app.set('trust proxy', 1);

// 安全中间件
app.use(helmet()); // 设置安全相关的HTTP头
app.use(xss()); // 防止XSS攻击

// CORS配置
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求速率限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP限制100个请求
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true
});
app.use('/api', apiLimiter);

// 登录接口单独限流
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 15分钟内最多10次尝试
  message: { success: false, error: '登录尝试次数过多，请15分钟后再试' },
  trustProxy: true
});
app.use('/api/auth/login', authLimiter);

// 日志中间件
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // 开发环境显示详细日志
}

// 解析请求体
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 挂载路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 前端路由处理（如果需要支持SPA应用）
app.get('*', (req, res) => {
  // 检查index.html是否存在
  const indexPath = path.resolve(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // 如果不需要支持SPA，可以移除这个路由或返回404
      res.status(404).json({ success: false, error: '资源未找到' });
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : statusCode === 404 ? '资源未找到' : '服务器错误'
  });
});

// 连接数据库
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,  // 5秒连接超时
  socketTimeoutMS: 45000           // 45秒套接字超时
})
.then(() => console.log('MongoDB 连接成功'))
.catch(err => {
  console.error('MongoDB 连接失败:', err.message);
  process.exit(1); // 连接失败时退出进程
});

// 监听数据库连接事件
const db = mongoose.connection;
db.on('error', (err) => console.error('MongoDB 连接错误:', err));
db.on('disconnected', () => console.warn('MongoDB 连接已断开，尝试重连...'));

// 启动服务器
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`服务器在${process.env.NODE_ENV || 'development'}模式下运行，端口: ${PORT}`);
});

// 处理未捕获的异常
process.on('unhandledRejection', (err) => {
  console.log('未处理的Promise拒绝:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.log('未捕获的异常:', err.message);
  server.close(() => process.exit(1));
});

// 优雅关闭服务器
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
