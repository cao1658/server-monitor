const express = require('express');
const { 
  executeCommand, 
  listFiles 
} = require('../controllers/ssh');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/:serverId/execute', protect, executeCommand);
router.get('/:serverId/files', protect, listFiles);

module.exports = router;