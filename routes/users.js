const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// 所有路由都需要登录
router.use(protect);

// 获取当前用户信息（所有登录用户可访问）
router.get('/me', (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

// 获取所有用户（仅管理员可访问）
router.get('/', authorize('admin'), async (req, res) => {
  // 实际应用中这里会查询所有用户
  res.status(200).json({
    success: true,
    message: '管理员查询所有用户列表'
  });
});

module.exports = router;
