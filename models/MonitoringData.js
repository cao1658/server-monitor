const mongoose = require('mongoose');

const MonitoringDataSchema = new mongoose.Schema({
  server: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  cpu: {
    usage: Number,
    temperature: Number,
    cores: [Number]
  },
  memory: {
    total: Number,
    used: Number,
    free: Number,
    usagePercentage: Number
  },
  disk: {
    total: Number,
    used: Number,
    free: Number,
    usagePercentage: Number
  },
  network: {
    rx_sec: Number,
    tx_sec: Number,
    connections: Number
  },
  uptime: Number,
  processes: {
    total: Number,
    running: Number,
    blocked: Number
  }
});

// 索引以提高查询性能
MonitoringDataSchema.index({ server: 1, timestamp: -1 });

module.exports = mongoose.model('MonitoringData', MonitoringDataSchema);