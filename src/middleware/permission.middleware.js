const { ForbiddenError } = require('../utils/errors');

function hasPermission(user, permissionName) {
  return user?.Role?.Permissions?.some((permission) => permission.name === permissionName);
}

function requirePermission(permissionName) {
  return (req, res, next) => {
    if (req.permissions?.includes(permissionName)) {
      return next();
    }
    return next(new ForbiddenError());
  };
}

module.exports = { requirePermission, hasPermission };
