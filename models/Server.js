const mongoose = require('mongoose');
const crypto = require('crypto');

// 验证加密密钥有效性
if (!process.env.ENCRYPTION_KEY) {
  throw new Error('环境变量 ENCRYPTION_KEY 未定义');
}
const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
if (keyBuffer.length !== 32) {
  throw new Error('ENCRYPTION_KEY 必须是 32字节的 hex 字符串（64个十六进制字符）');
}

const ServerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请提供服务器名称'],
    trim: true,
    maxlength: [50, '名称不能超过50个字符']
  },
  host: {
    type: String,
    required: [true, '请提供主机地址'],
    trim: true
  },
  port: {
    type: Number,
    required: [true, '请提供SSH端口'],
    default: 22
  },
  username: {
    type: String,
    required: [true, '请提供SSH用户名'],
    trim: true
  },
  password: {
    type: String,
    select: false
  },
  privateKey: {
    type: String,
    select: false
  },
  description: {
    type: String,
    maxlength: [500, '描述不能超过500个字符']
  },
  tags: [String],
  status: {
    type: String,
    enum: ['online', 'offline', 'warning', 'error'],
    default: 'offline',
    index: true // 添状态索引，优化查询
  },
  lastCheck: {
    type: Date,
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // 添加用户索引，优化查询
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 加密敏感数据（为password和privateKey生成独立IV）
ServerSchema.pre('save', function(next) {
  if (!this.isModified('password') && !this.isModified('privateKey')) {
    return next();
  }

  const algorithm = 'aes-256-ctr';
  const key = keyBuffer;

  // 处理密码加密
  if (this.isModified('password')) {
    // 空值直接存储，不加密
    if (this.password === '') {
      this.password = '';
    } else if (this.password) {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      const encrypted = Buffer.concat([cipher.update(this.password), cipher.final()]);
      this.password = iv.toString('hex') + ':' + encrypted.toString('hex');
    }
  }

  // 处理私钥加密（独立IV）
  if (this.isModified('privateKey')) {
    // 空值直接存储，不加密
    if (this.privateKey === '') {
      this.privateKey = '';
    } else if (this.privateKey) {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      const encrypted = Buffer.concat([cipher.update(this.privateKey), cipher.final()]);
      this.privateKey = iv.toString('hex') + ':' + encrypted.toString('hex');
    }
  }

  next();
});

// 解密密码（添加错误处理）
ServerSchema.methods.decryptPassword = function() {
  if (!this.password) return null;
  
  try {
    const algorithm = 'aes-256-ctr';
    const key = keyBuffer;
    
    const textParts = this.password.split(':');
    if (textParts.length < 2) {
      throw new Error('密码格式错误（缺少IV或密文）');
    }
    
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('密码解密失败:', error.message);
    return null;
  }
};

// 解密私钥（添加错误处理）
ServerSchema.methods.decryptPrivateKey = function() {
  if (!this.privateKey) return null;
  
  try {
    const algorithm = 'aes-256-ctr';
    const key = keyBuffer;
    
    const textParts = this.privateKey.split(':');
    if (textParts.length < 2) {
      throw new Error('私钥格式错误（缺少IV或密文）');
    }
    
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('私钥解密失败:', error.message);
    return null;
  }
};

module.exports = mongoose.model('Server', ServerSchema);
