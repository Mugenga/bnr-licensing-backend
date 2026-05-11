const { Role, Permission, RolePermission } = require('../../db/models');

const includePermissions = [{ model: Permission }];

async function findAll() {
  return Role.findAll({ include: includePermissions, order: [['name', 'ASC']] });
}

async function findById(id) {
  return Role.findByPk(id, { include: includePermissions });
}

async function findPermissions(names) {
  return Permission.findAll({ where: { name: names } });
}

async function create(data, options = {}) {
  return Role.create(data, options);
}

async function update(role, data) {
  return role.update(data);
}

async function remove(role) {
  return role.destroy();
}

async function setPermissions(roleId, permissions, transaction) {
  await RolePermission.destroy({ where: { role_id: roleId }, transaction });
  await RolePermission.bulkCreate(
    permissions.map((permission) => ({ role_id: roleId, permission_id: permission.id })),
    { transaction }
  );
}

module.exports = { findAll, findById, findPermissions, create, update, remove, setPermissions };
