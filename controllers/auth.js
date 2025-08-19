const User = require('../models/User');

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
