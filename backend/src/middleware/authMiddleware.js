const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'opsmind_super_secret_2024';

/**
 * Middleware: verify JWT token. Attaches req.user if valid.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Middleware: require admin role (must use after authMiddleware)
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
