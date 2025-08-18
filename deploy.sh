#!/bin/bash

# 确保脚本在错误时退出
set -e

echo "开始部署服务器监控系统..."

# 检查.env文件是否存在
if [ ! -f .env ]; then
  echo "未找到.env文件，从.env.example创建..."
  cp .env.example .env
  
  # 生成随机密钥
  JWT_SECRET=$(openssl rand -hex 32)
  ENCRYPTION_KEY=$(openssl rand -hex 32)
  
  # 更新.env文件中的密钥
  sed -i "s/your_jwt_secret_key_here/$JWT_SECRET/g" .env
  sed -i "s/your_encryption_key_here/$ENCRYPTION_KEY/g" .env
  
  echo ".env文件已创建并更新密钥"
fi

# 创建日志目录
mkdir -p logs

# 构建并启动容器
echo "构建并启动Docker容器..."
docker-compose up -d --build

echo "等待服务启动..."
sleep 5

# 检查服务是否正常运行
if docker-compose ps | grep -q "Up"; then
  echo "服务器监控系统已成功部署！"
  echo "可以通过以下地址访问："
  echo "http://localhost:5000"
else
  echo "部署失败，请检查日志以获取更多信息："
  docker-compose logs
fi