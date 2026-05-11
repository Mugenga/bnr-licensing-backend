const repository = require('./users.repository');
const { hashPassword } = require('../../utils/password');
const { NotFoundError } = require('../../utils/errors');

async function getUsers() {
  return repository.findAll();
}

async function getUser(id) {
  const user = await repository.findById(id);
  if (!user) throw new NotFoundError('User not found');
  return user;
}

async function createUser(data) {
  // Hash password before saving user, never store plain password.
  return repository.create({
    full_name: data.fullName,
    email: data.email,
    password_hash: await hashPassword(data.password),
    role_id: data.roleId,
    organization_name: data.organizationName,
    status: data.status
  });
}

async function updateUser(id, data) {
  // Keep existing values when frontend sends only some fields.
  const user = await getUser(id);
  return repository.update(user, {
    full_name: data.fullName ?? user.full_name,
    email: data.email ?? user.email,
    role_id: data.roleId ?? user.role_id,
    organization_name: data.organizationName ?? user.organization_name,
    status: data.status ?? user.status
  });
}

async function updateStatus(id, status) {
  const user = await getUser(id);
  return repository.update(user, { status });
}

module.exports = { getUsers, getUser, createUser, updateUser, updateStatus };
