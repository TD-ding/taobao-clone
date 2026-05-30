const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev_only_secret_change_in_prod';

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: '未登录' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token无效或已过期' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: '需要管理员权限' });
  next();
}

module.exports = { authMiddleware, adminMiddleware, SECRET };
