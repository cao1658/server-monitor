const Server = require('../models/Server');
const AuditLog = require('../models/AuditLog');

// @desc    获取所有服务器
// @route   GET /api/servers
// @access  Private
exports.getServers = async (req, res, next) => {
  try {
    // 根据用户角色过滤
    let query;
    if (req.user.role !== 'admin') {
      query = Server.find({ user: req.user.id });
    } else {
      query = Server.find();
    }

    const servers = await query;

    res.status(200).json({
      success: true,
      count: servers.length,
      data: servers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    获取单个服务器
// @route   GET /api/servers/:id
// @access  Private
exports.getServer = async (req, res, next) => {
  try {
    const server = await Server.findById(req.params.id);

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

    res.status(200).json({
      success: true,
      data: server
    });
  } catch (err) {
    next(err);
  }
};

// @desc    创建服务器
// @route   POST /api/servers
// @access  Private
exports.createServer = async (req, res, next) => {
  try {
    // 添加用户到请求体
    req.body.user = req.user.id;

    const server = await Server.create(req.body);

    // 记录审计日志
    await AuditLog.create({
      user: req.user.id,
      server: server._id,
      action: 'server_add',
      details: {
        name: server.name,
        host: server.host
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      data: server
    });
  } catch (err) {
    next(err);
  }
};

// @desc    更新服务器
// @route   PUT /api/servers/:id
// @access  Private
exports.updateServer = async (req, res, next) => {
  try {
    let server = await Server.findById(req.params.id);

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
        error: '没有权限更新此服务器'
      });
    }

    server = await Server.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // 记录审计日志
    await AuditLog.create({
      user: req.user.id,
      server: server._id,
      action: 'server_update',
      details: {
        name: server.name,
        host: server.host,
        updatedFields: Object.keys(req.body)
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      data: server
    });
  } catch (err) {
    next(err);
  }
};

// @desc    删除服务器
// @route   DELETE /api/servers/:id
// @access  Private
exports.deleteServer = async (req, res, next) => {
  try {
    const server = await Server.findById(req.params.id);

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
        error: '没有权限删除此服务器'
      });
    }

    await server.deleteOne();

    // 记录审计日志
    await AuditLog.create({
      user: req.user.id,
      action: 'server_delete',
      details: {
        name: server.name,
        host: server.host,
        serverId: server._id
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};