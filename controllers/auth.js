const User = require('../models/User');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// 用户注册
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 创建用户
    const user = await User.create({
      name,
      email,
      password  // 会被 pre-save 钩子自动哈希
    });

    // 生成令牌
    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证邮箱和密码是否提供
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '请提供邮箱和密码'
      });
    }

    // 查找用户并获取密码（因为模型中 select: false）
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '邮箱或密码不正确'
      });
    }

    // 验证密码
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: '邮箱或密码不正确'
      });
    }

    // 生成令牌
    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// 刷新访问令牌
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: '请提供刷新令牌'
      });
    }

    // 验证刷新令牌
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // 查找用户
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '刷新令牌无效'
      });
    }

    // 生成新的访问令牌
    const accessToken = user.getSignedJwtToken();
    res.status(200).json({
      success: true,
      accessToken
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: '刷新令牌无效或已过期'
    });
  }
};

// 忘记密码
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 查找用户
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '该邮箱未注册'
      });
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(20).toString('hex');

    // 设置令牌过期时间（1小时）
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 3600000; // 1小时

    await user.save({ validateBeforeSave: false });

    // 在实际应用中，这里应该发送邮件
    // 但在此示例中，我们只返回成功消息和令牌（实际应用中不应返回令牌）
    
    // TODO: 实现邮件发送功能
    // const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    // 发送包含resetUrl的邮件

    res.status(200).json({
      success: true,
      message: '密码重置邮件已发送',
      // 注意：实际应用中不应返回令牌，这里仅用于测试
      resetToken
    });
  } catch (err) {
    console.error('忘记密码错误:', err);

    // 清除重置令牌相关字段
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      error: '无法发送重置邮件'
    });
  }
};

// 重置密码
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // 获取加密的令牌
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // 查找有效的重置令牌
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: '无效或已过期的重置令牌'
      });
    }

    // 设置新密码
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // 返回新令牌
    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('重置密码错误:', err);
    return res.status(500).json({
      success: false,
      error: '重置密码失败'
    });
  }
};

// 辅助函数：生成令牌并返回响应
const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};
