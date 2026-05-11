const { User, Role, Permission, RolePermission } = require('../../db/models');
const { comparePassword, hashPassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');
const { BadRequestError, UnauthorizedError } = require('../../utils/errors');

// This function loads permissions for a user based on their role and attaches them to the user object
async function attachRolePermissions(user) {
  const rolePermissions = await RolePermission.findAll({
    where: { role_id: user.role_id },
    include: [Permission]
  });
  user.Role.Permissions = rolePermissions.map((row) => row.Permission);
  return user;
}

// Authenticate user 
async function login({ email, password }) {
  const user = await User.findOne({ where: { email }, include: [Role] });

  if (!user || user.status !== 'active') throw new UnauthorizedError('Invalid credentials');
  const ok = await comparePassword(password, user.password_hash);
  if (!ok) throw new UnauthorizedError('Invalid credentials');

  await attachRolePermissions(user); // Load permissions for the authenticated user

  return { token: signToken(user), user };
}

// Register a new applicant user 
async function register({ fullName, email, password, organizationName }) {
  // Check if email is already registered
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw new BadRequestError('Email is already registered');

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

  const userWithRole = await User.findByPk(user.id, { include: [Role] });
  await attachRolePermissions(userWithRole); // Load permissions for the new user

  return { token: signToken(userWithRole), user: userWithRole }; // Return role and token for the new user
}

// Get current user info
async function me(user) {
  return user;
}

module.exports = { login, register, me };
