const { sequelize, Permission } = require('../../db/models');
const repository = require('./roles.repository');
const { BadRequestError, NotFoundError } = require('../../utils/errors');
const { DANGEROUS_PERMISSION_COMBINATIONS } = require('../applications/applicationPermissions');

function assertSafePermissionSet(permissionNames) {
  for (const [left, right] of DANGEROUS_PERMISSION_COMBINATIONS) {
    if (permissionNames.includes(left) && permissionNames.includes(right)) {
      throw new BadRequestError(`Role cannot contain both ${left} and ${right}.`);
    }
  }
}

async function getRoles() {
  return repository.findAll();
}

async function getRole(id) {
  const role = await repository.findById(id);
  if (!role) throw new NotFoundError('Role not found');
  return role;
}

async function createRole(data) {
  assertSafePermissionSet(data.permissionNames);
  const roleId = await sequelize.transaction(async (transaction) => {
    const role = await repository.create({
      name: data.name,
      description: data.description,
      is_system_role: false
    }, { transaction });
    const permissions = await repository.findPermissions(data.permissionNames);
    await repository.setPermissions(role.id, permissions, transaction);
    return role.id;
  });
  return getRole(roleId);
}

async function updateRole(id, data) {
  const role = await getRole(id);
  return repository.update(role, data);
}

async function deleteRole(id) {
  const role = await getRole(id);
  if (role.is_system_role) throw new BadRequestError('System roles cannot be deleted.');
  await repository.remove(role);
}

async function getPermissions() {
  return Permission.findAll({ order: [['name', 'ASC']] });
}

async function setRolePermissions(id, permissionNames) {
  assertSafePermissionSet(permissionNames);
  await getRole(id);
  await sequelize.transaction(async (transaction) => {
    const permissions = await repository.findPermissions(permissionNames);
    if (permissions.length !== permissionNames.length) {
      throw new BadRequestError('One or more permissions do not exist.');
    }
    await repository.setPermissions(id, permissions, transaction);
  });
  return getRole(id);
}

module.exports = { getRoles, getRole, createRole, updateRole, deleteRole, getPermissions, setRolePermissions };
