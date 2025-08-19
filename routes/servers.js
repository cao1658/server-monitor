const express = require('express');
const { 
  getServers, 
  getServer, 
  createServer, 
  updateServer, 
  deleteServer,
  testServerConnection // 导入新增的控制器函数
} = require('../controllers/servers');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 已有的路由
router.route('/')
  .get(protect, getServers)
  .post(protect, createServer);

// 新增：测试连接的路由
router.post('/test-connection', protect, testServerConnection);

// 已有的路由
router.route('/:id')
  .get(protect, getServer)
  .put(protect, updateServer)
  .delete(protect, deleteServer);

module.exports = router;
