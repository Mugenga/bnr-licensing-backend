const { User, Role, Permission, RolePermission } = require('../../db/models');
const { comparePassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');
const { UnauthorizedError } = require('../../utils/errors');

async function login({ email, password }) {
  const user = await User.findOne({ where: { email }, include: [Role] });

  if (!user || user.status !== 'active') throw new UnauthorizedError('Invalid credentials');
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) throw new UnauthorizedError('Invalid credentials');

  const rolePermissions = await RolePermission.findAll({
    where: { role_id: user.role_id },
    include: [Permission]
  });
  user.Role.Permissions = rolePermissions.map((row) => row.Permission);

  return { token: signToken(user), user };
}

async function me(user) {
  return user;
}

module.exports = { login, me };
