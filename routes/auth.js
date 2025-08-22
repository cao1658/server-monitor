const express = require('express');
const { register, login, refreshToken, forgotPassword, resetPassword } = require('../controllers/auth');
const router = express.Router();

// 注册
router.post('/register', register);

// 登录
router.post('/login', login);

// 刷新令牌
router.post('/refresh-token', refreshToken);

// 忘记密码
router.post('/forgot-password', forgotPassword);

// 重置密码
router.post('/reset-password', resetPassword);

module.exports = router;
