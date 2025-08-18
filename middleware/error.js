// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  // 记录错误到控制台
  console.error(err);

  // Mongoose错误处理
  let error = { ...err };
  error.message = err.message;

  // Mongoose ID错误
  if (err.name === 'CastError') {
    const message = '资源不存在';
    error = new Error(message);
    error.statusCode = 404;
  }

  // Mongoose重复键错误
  if (err.code === 11000) {
    const message = '已存在相同的记录';
    error = new Error(message);
    error.statusCode = 400;
  }

  // Mongoose验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new Error(message.join(', '));
    error.statusCode = 400;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || '服务器错误'
  });
};

module.exports = errorHandler;