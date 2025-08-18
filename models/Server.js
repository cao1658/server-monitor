const mongoose = require('mongoose');
const crypto = require('crypto');

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
    default: 'offline'
  },
  lastCheck: {
    type: Date,
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 加密敏感数据
ServerSchema.pre('save', function(next) {
  if (!this.isModified('password') && !this.isModified('privateKey')) {
    return next();
  }

  const algorithm = 'aes-256-ctr';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);

  if (this.password) {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(this.password), cipher.final()]);
    this.password = iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  if (this.privateKey) {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(this.privateKey), cipher.final()]);
    this.privateKey = iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  next();
});

// 解密方法
ServerSchema.methods.decryptPassword = function() {
  if (!this.password) return null;
  
  const algorithm = 'aes-256-ctr';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  
  const textParts = this.password.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  
  return decrypted.toString();
};

ServerSchema.methods.decryptPrivateKey = function() {
  if (!this.privateKey) return null;
  
  const algorithm = 'aes-256-ctr';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  
  const textParts = this.privateKey.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  
  return decrypted.toString();
};

module.exports = mongoose.model('Server', ServerSchema);