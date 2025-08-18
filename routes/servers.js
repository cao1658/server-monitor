const express = require('express');
const { 
  getServers, 
  getServer, 
  createServer, 
  updateServer, 
  deleteServer 
} = require('../controllers/servers');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getServers)
  .post(protect, createServer);

router.route('/:id')
  .get(protect, getServer)
  .put(protect, updateServer)
  .delete(protect, deleteServer);

module.exports = router;