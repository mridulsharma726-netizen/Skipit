const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: User authentication required',
      });
    }

    const userRole = req.user.role || 'user';
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: Requires one of [${roles.join(', ')}] permissions`,
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
  requireAdmin: requireRole('admin'),
  requireModeratorOrAdmin: requireRole('moderator', 'admin'),
};
