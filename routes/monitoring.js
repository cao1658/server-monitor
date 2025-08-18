const express = require('express');
const { 
  getServerMonitoring, 
  getAllServersMonitoring, 
  collectLocalMonitoring, 
  collectRemoteMonitoring 
} = require('../controllers/monitoring');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getAllServersMonitoring);
router.get('/:serverId', protect, getServerMonitoring);
router.post('/collect-local', protect, authorize('admin'), collectLocalMonitoring);
router.post('/collect-remote/:serverId', protect, collectRemoteMonitoring);

module.exports = router;