const crypto = require('crypto');

// 加密数据
exports.encrypt = (text, key) => {
  if (!text) return null;
  
  const algorithm = 'aes-256-ctr';
  const iv = crypto.randomBytes(16);
  const keyBuffer = Buffer.from(key, 'hex');
  
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// 解密数据
exports.decrypt = (encryptedText, key) => {
  if (!encryptedText) return null;
  
  const algorithm = 'aes-256-ctr';
  const keyBuffer = Buffer.from(key, 'hex');
  
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedBuffer = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
  
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  
  return decrypted.toString();
};

// 生成随机密钥
exports.generateKey = () => {
  return crypto.randomBytes(32).toString('hex');
};