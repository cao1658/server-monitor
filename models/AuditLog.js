const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server'
  },
  action: {
    type: String,
    required: [true, '请提供操作类型'],
    enum: [
      'login', 
      'logout', 
      'server_add', 
      'server_update', 
      'server_delete', 
      'ssh_command', 
      'file_upload', 
      'file_download', 
      'file_delete'
    ]
  },
  details: {
    type: Object,
    required: [true, '请提供操作详情']
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// 索引以提高查询性能
AuditLogSchema.index({ user: 1, timestamp: -1 });
AuditLogSchema.index({ server: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);