const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');

// 加载环境变量
dotenv.config();

// 导入路由
const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/servers');
const monitoringRoutes = require('./routes/monitoring');
const sshRoutes = require('./routes/ssh');
const fileRoutes = require('./routes/files');

// 初始化Express应用
const app = express();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => console.error('MongoDB连接失败:', err));

// 安全中间件
app.use(helmet());
app.use(xss());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true
}));

// 请求速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP限制100个请求
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// 日志中间件
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 解析请求体
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/ssh', sshRoutes);
app.use('/api/files', fileRoutes);

// 前端路由处理
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || '服务器错误'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`服务器在${process.env.NODE_ENV}模式下运行，端口: ${PORT}`);
});

// 处理未捕获的异常
process.on('unhandledRejection', (err) => {
  console.log('未处理的Promise拒绝:', err);
  // 关闭服务器并退出进程
  // server.close(() => process.exit(1));
});