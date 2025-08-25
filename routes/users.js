const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  changePassword, 
  deleteUser 
} = require('../controllers/users');
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

// 用户管理路由（仅管理员可访问）
router.use(authorize('admin'));

// 获取所有用户
router.get('/', getUsers);

// 获取单个用户
router.get('/:id', getUser);

// 创建用户
router.post('/', createUser);

// 更新用户
router.put('/:id', updateUser);

// 更改用户密码
router.put('/:id/change-password', changePassword);

// 删除用户
router.delete('/:id', deleteUser);

module.exports = router;
