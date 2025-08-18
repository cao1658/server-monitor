const express = require('express');
const { 
  uploadFile, 
  downloadFile, 
  deleteFile 
} = require('../controllers/files');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/:serverId/upload', protect, uploadFile);
router.get('/:serverId/download', protect, downloadFile);
router.delete('/:serverId/delete', protect, deleteFile);

module.exports = router;