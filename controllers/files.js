const Server = require('../models/Server');
const AuditLog = require('../models/AuditLog');
const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');
const os = require('os');

// @desc    上传文件到服务器
// @route   POST /api/files/:serverId/upload
// @access  Private
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        error: '没有上传文件'
      });
    }

    const { remotePath } = req.body;
    if (!remotePath) {
      return res.status(400).json({
        success: false,
        error: '请提供远程路径'
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

    const file = req.files.file;
    const tempPath = path.join(os.tmpdir(), file.name);

    // 保存文件到临时目录
    await file.mv(tempPath);

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

      // 上传文件
      await ssh.putFile(tempPath, `${remotePath}/${file.name}`);

      // 记录审计日志
      await AuditLog.create({
        user: req.user.id,
        server: server._id,
        action: 'file_upload',
        details: {
          fileName: file.name,
          remotePath: `${remotePath}/${file.name}`,
          fileSize: file.size
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // 删除临时文件
      fs.unlinkSync(tempPath);

      ssh.dispose();

      res.status(200).json({
        success: true,
        data: {
          fileName: file.name,
          remotePath: `${remotePath}/${file.name}`,
          size: file.size
        }
      });
    } catch (error) {
      // 删除临时文件
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      return res.status(500).json({
        success: false,
        error: `文件上传错误: ${error.message}`
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    从服务器下载文件
// @route   GET /api/files/:serverId/download
// @access  Private
exports.downloadFile = async (req, res, next) => {
  try {
    const { remotePath } = req.query;
    
    if (!remotePath) {
      return res.status(400).json({
        success: false,
        error: '请提供远程文件路径'
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

    const fileName = path.basename(remotePath);
    const tempPath = path.join(os.tmpdir(), fileName);

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

      // 下载文件
      await ssh.getFile(tempPath, remotePath);

      // 记录审计日志
      await AuditLog.create({
        user: req.user.id,
        server: server._id,
        action: 'file_download',
        details: {
          fileName,
          remotePath
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      ssh.dispose();

      // 发送文件
      res.download(tempPath, fileName, (err) => {
        if (err) {
          next(err);
        }
        
        // 下载完成后删除临时文件
        fs.unlinkSync(tempPath);
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: `文件下载错误: ${error.message}`
      });
    }
  } catch (err) {
    next(err);
  }
};

// @desc    删除服务器上的文件
// @route   DELETE /api/files/:serverId/delete
// @access  Private
exports.deleteFile = async (req, res, next) => {
  try {
    const { remotePath } = req.body;
    
    if (!remotePath) {
      return res.status(400).json({
        success: false,
        error: '请提供远程文件路径'
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

      // 删除文件
      const result = await ssh.execCommand(`rm -f "${remotePath}"`);

      if (result.code !== 0) {
        return res.status(400).json({
          success: false,
          error: result.stderr || '删除文件失败'
        });
      }

      // 记录审计日志
      await AuditLog.create({
        user: req.user.id,
        server: server._id,
        action: 'file_delete',
        details: {
          remotePath
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      ssh.dispose();

      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: `文件删除错误: ${error.message}`
      });
    }
  } catch (err) {
    next(err);
  }
};