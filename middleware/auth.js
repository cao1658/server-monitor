const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 保护路由：验证用户是否登录
exports.protect = async (req, res, next) => {
  let token;

  // 从请求头获取令牌（格式：Bearer <token>）
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 检查令牌是否存在
  if (!token) {
    return res.status(401).json({
      success: false,
      error: '未授权访问：请先登录'
    });
  }

  try {
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 将用户信息添加到请求对象（不包含密码）
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: '未授权访问：令牌无效或已过期'
    });
  }
};

// 角色授权：验证用户是否有指定角色
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `角色 ${req.user.role} 无权访问此资源`
      });
    }
    next();
  };
};
