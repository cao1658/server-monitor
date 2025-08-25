const User = require('../models/User');

// 获取所有用户
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

// 获取单个用户
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '找不到该用户'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};

// 创建用户
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '该邮箱已被注册'
      });
    }
    
    // 创建用户
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'  // 默认为普通用户
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// 更新用户
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    // 查找用户
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '找不到该用户'
      });
    }
    
    // 如果要更改邮箱，检查新邮箱是否已被使用
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: '该邮箱已被其他用户使用'
        });
      }
    }
    
    // 更新用户信息
    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// 更改用户密码
exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    // 查找用户
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '找不到该用户'
      });
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: '密码已更新'
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// 删除用户
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '找不到该用户'
      });
    }
    
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      message: '用户已删除'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
};