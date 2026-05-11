const { User, Role, Permission, RolePermission } = require('../../db/models');
const { comparePassword, hashPassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');
const { BadRequestError, UnauthorizedError } = require('../../utils/errors');

async function attachRolePermissions(user) {
  // Load permissions from DB, not from JWT.
  const rolePermissions = await RolePermission.findAll({
    where: { role_id: user.role_id },
    include: [Permission]
  });
  user.Role.Permissions = rolePermissions.map((row) => row.Permission);
  return user;
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email }, include: [Role] });

  if (!user || user.status !== 'active') throw new UnauthorizedError('Invalid credentials');
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) throw new UnauthorizedError('Invalid credentials');

  await attachRolePermissions(user);

  return { token: signToken(user), user };
}

async function register({ fullName, email, password, organizationName }) {
  // Email must stay unique for applicant account.
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw new BadRequestError('Email is already registered');

  // Signup always creates applicant, so role must already be seeded.
  const applicantRole = await Role.findOne({ where: { name: 'applicant' } });
  if (!applicantRole) throw new BadRequestError('Applicant role is not configured');

  const user = await User.create({
    full_name: fullName,
    email,
    password_hash: await hashPassword(password),
    role_id: applicantRole.id,
    organization_name: organizationName,
    status: 'active'
  });

  // Reload with role and permissions so frontend gets same data as login.
  const userWithRole = await User.findByPk(user.id, { include: [Role] });
  await attachRolePermissions(userWithRole);

  return { token: signToken(userWithRole), user: userWithRole };
}

async function me(user) {
  return user;
}

module.exports = { login, register, me };
