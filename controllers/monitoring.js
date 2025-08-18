const Server = require('../models/Server');
const MonitoringData = require('../models/MonitoringData');
const { NodeSSH } = require('node-ssh');
const systemInfo = require('systeminformation');

// @desc    获取服务器监控数据
// @route   GET /api/monitoring/:serverId
// @access  Private
exports.getServerMonitoring = async (req, res, next) => {
  try {
    const server = await Server.findById(req.params.serverId);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: '找不到服务器'
      });
    }

    // 确保用户是服务器的所有者或管理员
    if (server.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '没有权限访问此服务器的监控数据'
      });
    }

    // 获取最近的监控数据
    const monitoringData = await MonitoringData.find({ server: req.params.serverId })
      .sort({ timestamp: -1 })
      .limit(parseInt(req.query.limit) || 24);

    res.status(200).json({
      success: true,
      count: monitoringData.length,
      data: monitoringData
    });
  } catch (err) {
    next(err);
  }
};

// @desc    获取所有服务器的最新监控数据
// @route   GET /api/monitoring
// @access  Private
exports.getAllServersMonitoring = async (req, res, next) => {
  try {
    // 根据用户角色过滤
    let serverQuery;
    if (req.user.role !== 'admin') {
      serverQuery = { user: req.user.id };
    } else {
      serverQuery = {};
    }

    const servers = await Server.find(serverQuery);
    const serverIds = servers.map(server => server._id);

    // 对每个服务器获取最新的监控数据
    const latestData = [];
    for (const serverId of serverIds) {
      const data = await MonitoringData.findOne({ server: serverId })
        .sort({ timestamp: -1 });
      
      if (data) {
        latestData.push(data);
      }
    }

    res.status(200).json({
      success: true,
      count: latestData.length,
      data: latestData
    });
  } catch (err) {
    next(err);
  }
};

// @desc    收集本地服务器监控数据
// @route   POST /api/monitoring/collect-local
// @access  Private/Admin
exports.collectLocalMonitoring = async (req, res, next) => {
  try {
    // 只允许管理员收集本地监控数据
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '没有权限执行此操作'
      });
    }

    // 收集系统信息
    const [cpu, mem, disk, netStats, currentLoad, processes] = await Promise.all([
      systemInfo.cpu(),
      systemInfo.mem(),
      systemInfo.fsSize(),
      systemInfo.networkStats(),
      systemInfo.currentLoad(),
      systemInfo.processes()
    ]);

    // 创建监控数据对象
    const monitoringData = {
      server: req.body.serverId,
      cpu: {
        usage: currentLoad.currentLoad,
        temperature: cpu.temperature ? cpu.temperature.main : null,
        cores: currentLoad.cpus.map(c => c.load)
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        usagePercentage: (mem.used / mem.total) * 100
      },
      disk: {
        total: disk[0].size,
        used: disk[0].used,
        free: disk[0].available,
        usagePercentage: disk[0].use
      },
      network: {
        rx_sec: netStats[0].rx_sec,
        tx_sec: netStats[0].tx_sec,
        connections: null
      },
      uptime: systemInfo.time().uptime,
      processes: {
        total: processes.all,
        running: processes.running,
        blocked: processes.blocked
      }
    };

    // 保存监控数据
    const data = await MonitoringData.create(monitoringData);

    // 更新服务器状态
    await Server.findByIdAndUpdate(req.body.serverId, {
      status: 'online',
      lastCheck: Date.now()
    });

    res.status(201).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

// @desc    收集远程服务器监控数据
// @route   POST /api/monitoring/collect-remote/:serverId
// @access  Private
exports.collectRemoteMonitoring = async (req, res, next) => {
  try {
    const server = await Server.findById(req.params.serverId).select('+password +privateKey');

    if (!server) {
      return res.status(404).json({
        success: false,
        error: '找不到服务器'
      });
    }

    // 确保用户是服务器的所有者或管理员
    if (server.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '没有权限访问此服务器'
      });
    }

    // 连接到远程服务器
    const ssh = new NodeSSH();
    
    try {
      // 使用密码或私钥连接
      if (server.privateKey) {
        await ssh.connect({
          host: server.host,
          port: server.port,
          username: server.username,
          privateKey: server.decryptPrivateKey()
        });
      } else {
        await ssh.connect({
          host: server.host,
          port: server.port,
          username: server.username,
          password: server.decryptPassword()
        });
      }

      // 执行命令收集监控数据
      const [cpuUsage, memInfo, diskInfo, netInfo, uptime, procInfo] = await Promise.all([
        ssh.execCommand("top -bn1 | grep 'Cpu(s)' | awk '{print $2 + $4}'"),
        ssh.execCommand("free -m | grep Mem | awk '{print $2,$3,$4,$3/$2*100}'"),
        ssh.execCommand("df -h / | tail -1 | awk '{print $2,$3,$4,$5}'"),
        ssh.execCommand("netstat -an | grep ESTABLISHED | wc -l"),
        ssh.execCommand("uptime -p"),
        ssh.execCommand("ps -e | wc -l")
      ]);

      // 解析结果
      const memParts = memInfo.stdout.split(' ');
      const diskParts = diskInfo.stdout.split(' ');
      
      // 创建监控数据对象
      const monitoringData = {
        server: server._id,
        cpu: {
          usage: parseFloat(cpuUsage.stdout),
          temperature: null,
          cores: []
        },
        memory: {
          total: parseInt(memParts[0]) * 1024 * 1024,
          used: parseInt(memParts[1]) * 1024 * 1024,
          free: parseInt(memParts[2]) * 1024 * 1024,
          usagePercentage: parseFloat(memParts[3])
        },
        disk: {
          total: parseHumanReadable(diskParts[0]),
          used: parseHumanReadable(diskParts[1]),
          free: parseHumanReadable(diskParts[2]),
          usagePercentage: parseFloat(diskParts[3].replace('%', ''))
        },
        network: {
          rx_sec: null,
          tx_sec: null,
          connections: parseInt(netInfo.stdout)
        },
        uptime: parseUptime(uptime.stdout),
        processes: {
          total: parseInt(procInfo.stdout),
          running: null,
          blocked: null
        }
      };

      // 保存监控数据
      const data = await MonitoringData.create(monitoringData);

      // 更新服务器状态
      await Server.findByIdAndUpdate(server._id, {
        status: 'online',
        lastCheck: Date.now()
      });

      ssh.dispose();

      res.status(201).json({
        success: true,
        data
      });
    } catch (error) {
      // 更新服务器状态为离线
      await Server.findByIdAndUpdate(server._id, {
        status: 'offline',
        lastCheck: Date.now()
      });

      return res.status(500).json({
        success: false,
        error: `无法连接到服务器: ${error.message}`
      });
    }
  } catch (err) {
    next(err);
  }
};

// 辅助函数：解析人类可读的存储大小
function parseHumanReadable(size) {
  const unit = size.replace(/[0-9.]/g, '');
  const value = parseFloat(size.replace(/[^0-9.]/g, ''));
  
  switch(unit.toUpperCase()) {
    case 'K':
      return value * 1024;
    case 'M':
      return value * 1024 * 1024;
    case 'G':
      return value * 1024 * 1024 * 1024;
    case 'T':
      return value * 1024 * 1024 * 1024 * 1024;
    default:
      return value;
  }
}

// 辅助函数：解析uptime输出
function parseUptime(uptimeStr) {
  // 示例: "up 2 days, 3 hours, 4 minutes"
  const days = uptimeStr.match(/(\d+) day/);
  const hours = uptimeStr.match(/(\d+) hour/);
  const minutes = uptimeStr.match(/(\d+) minute/);
  
  let totalSeconds = 0;
  if (days) totalSeconds += parseInt(days[1]) * 86400;
  if (hours) totalSeconds += parseInt(hours[1]) * 3600;
  if (minutes) totalSeconds += parseInt(minutes[1]) * 60;
  
  return totalSeconds;
}