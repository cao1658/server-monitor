# 服务器监控系统

一个基于Node.js的服务器监控系统，可以实时监控多台服务器的性能指标、执行SSH命令并提供安全的文件传输功能。

## 功能特点

- 实时服务器性能监控（CPU、内存、磁盘、网络）
- 安全的SSH命令执行
- 文件上传和下载
- 用户认证和授权
- 安全审计日志
- 实时通知和警报
- 响应式Web界面

## 系统要求

- Node.js 14.x 或更高版本
- MongoDB 5.0 或更高版本
- Docker 和 Docker Compose (用于容器化部署)

## 快速开始

### 使用Docker部署

1. 克隆仓库
```bash
git clone https://github.com/cao1568/server-monitor.git
cd server-monitor
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，设置适当的值
```

3. 使用部署脚本启动应用
```bash
chmod +x deploy.sh
./deploy.sh
```

4. 访问应用
```
http://localhost:5000
```

### 手动部署

1. 克隆仓库
```bash
git clone https://github.com/cao1658/server-monitor.git
cd server-monitor
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，设置适当的值
```

4. 启动MongoDB
```bash
# 确保MongoDB已安装并运行
```

5. 启动应用
```bash
npm start
```

## 环境变量说明

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| PORT | 应用监听端口 | 5000 |
| NODE_ENV | 环境模式 | production |
| MONGODB_URI | MongoDB连接字符串 | mongodb://mongodb:27017/serverguard |
| JWT_SECRET | JWT签名密钥 | (必须设置) |
| JWT_EXPIRE | JWT过期时间 | 30d |
| CLIENT_URL | 客户端URL(CORS) | http://localhost:3000 |
| ALLOWED_ORIGINS | 允许的CORS源 | http://localhost:3000 |
| ENCRYPTION_KEY | 敏感数据加密密钥 | (必须设置) |
| MONITORING_INTERVAL | 监控间隔(毫秒) | 60000 |

## 安全说明

本系统实现了多层安全保护：

1. **API安全**：
   - JWT认证
   - 请求速率限制
   - CORS保护
   - XSS和注入防护

2. **SSH安全**：
   - 命令白名单和黑名单
   - 敏感路径保护
   - 文件传输限制
   - 操作审计日志

3. **数据安全**：
   - 敏感信息加密存储
   - 密码和密钥保护

## 项目结构

```
server-monitor/
├── controllers/       # 控制器
├── middleware/        # 中间件
├── models/            # 数据模型
├── routes/            # API路由
├── services/          # 业务服务
├── utils/             # 工具函数
├── public/            # 前端静态文件
├── server.js          # 应用入口
├── package.json       # 项目配置
├── Dockerfile         # Docker配置
└── docker-compose.yml # Docker Compose配置
```

## API文档

### 认证API

- `POST /api/auth/register` - 注册新用户
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/logout` - 用户退出登录
- `GET /api/auth/me` - 获取当前用户信息

### 服务器API

- `GET /api/servers` - 获取所有服务器
- `GET /api/servers/:id` - 获取单个服务器
- `POST /api/servers` - 创建新服务器
- `PUT /api/servers/:id` - 更新服务器
- `DELETE /api/servers/:id` - 删除服务器

### 监控API

- `GET /api/monitoring` - 获取所有服务器的最新监控数据
- `GET /api/monitoring/:serverId` - 获取特定服务器的监控数据
- `POST /api/monitoring/collect-local` - 收集本地服务器监控数据
- `POST /api/monitoring/collect-remote/:serverId` - 收集远程服务器监控数据

### SSH API

- `POST /api/ssh/:serverId/execute` - 在服务器上执行SSH命令
- `GET /api/ssh/:serverId/files` - 获取服务器文件列表

### 文件API

- `POST /api/files/:serverId/upload` - 上传文件到服务器
- `GET /api/files/:serverId/download` - 从服务器下载文件
- `DELETE /api/files/:serverId/delete` - 删除服务器上的文件

## 许可证

MIT