const { User, Role, Permission, RolePermission } = require('../db/models');
const { verifyToken } = require('../utils/jwt');
const { UnauthorizedError } = require('../utils/errors');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedError();
    }

    const payload = verifyToken(token);
    const user = await User.findByPk(payload.userId, { include: [Role] });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedError();
    }

    const rolePermissions = await RolePermission.findAll({
      where: { role_id: user.role_id },
      include: [Permission]
    });
    user.Role.Permissions = rolePermissions.map((row) => row.Permission);
    req.user = user;
    req.permissions = user.Role.Permissions.map((permission) => permission.name);
    return next();
  } catch (error) {
    return next(error.statusCode ? error : new UnauthorizedError());
  }
}

module.exports = { requireAuth };
