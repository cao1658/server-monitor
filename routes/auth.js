const express = require('express');
const { register, login, refreshToken } = require('../controllers/auth');
const router = express.Router();

// 注册
router.post('/register', register);

// 登录
router.post('/login', login);

// 刷新令牌
router.post('/refresh-token', refreshToken);

module.exports = router;
