const Server = require('../models/Server');
const AuditLog = require('../models/AuditLog');
const { NodeSSH } = require('node-ssh');

// 命令黑名单
const BLACKLISTED_COMMANDS = [
  'rm -rf /',
  'mkfs',
  'dd if=/dev/zero',
  'echo > /dev/sda',
  ':(){:|:&};:',
  '> /dev/sda',
  'mv /* /dev/null',
  'wget http',
  'curl http',
  'shutdown',
  'reboot',
  'halt',
  'poweroff'
];

// @desc    执行SSH命令
// @route   POST /api/ssh/:serverId/execute
// @access  Private
exports.executeCommand = async (req, res, next) => {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({
        success: false,
        error: '请提供要执行的命令'
      });
    }

    // 检查命令黑名单
    if (BLACKLISTED_COMMANDS.some(blacklisted => command.includes(blacklisted))) {
      return res.status(403).json({
        success: false,
        error: '禁止执行此命令'
      });
    }

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

      // 执行命令
      const result = await ssh.execCommand(command);

      // 记录审计日志
      await AuditLog.create({
        user: req.user.id,
        server: server._id,
        action: 'ssh_command',
        details: {
          command,
          exitCode: result.code
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      ssh.dispose();

      res.status(200).json({
        success: true,
        data: {
          stdout: result.stdout,
          stderr: result.stderr,
          code: result.code
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: `SSH连接错误: ${error.message}`
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    获取服务器文件列表
// @route   GET /api/ssh/:serverId/files
// @access  Private
exports.listFiles = async (req, res, next) => {
  try {
    const { path = '.' } = req.query;
    
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

      // 列出文件
      const result = await ssh.execCommand(`ls -la ${path}`);

      ssh.dispose();

      if (result.code !== 0) {
        return res.status(400).json({
          success: false,
          error: result.stderr
        });
      }

      // 解析ls输出
      const files = parseListOutput(result.stdout);

      res.status(200).json({
        success: true,
        data: files
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: `SSH连接错误: ${error.message}`
      });
    }
  } catch (err) {
    next(err);
  }
};

// 辅助函数：解析ls -la输出
function parseListOutput(output) {
  const lines = output.split('\n').filter(line => line.trim() !== '');
  // 跳过总计行
  const fileLines = lines.slice(1);
  
  return fileLines.map(line => {
    const parts = line.split(/\s+/);
    // 典型的ls -la输出格式: 权限 链接数 所有者 组 大小 月 日 时间 名称
    return {
      permissions: parts[0],
      owner: parts[2],
      group: parts[3],
      size: parseInt(parts[4]),
      date: `${parts[5]} ${parts[6]} ${parts[7]}`,
      name: parts.slice(8).join(' '),
      isDirectory: parts[0].startsWith('d')
    };
  });
}