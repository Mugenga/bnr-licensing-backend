const service = require('./roles.service');
const asyncHandler = require('../../utils/asyncHandler');

function roleDto(role) {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystemRole: role.is_system_role,
    permissions: role.Permissions?.map((permission) => permission.name) || []
  };
}

const list = asyncHandler(async (req, res) => res.json({ data: (await service.getRoles()).map(roleDto) }));
const get = asyncHandler(async (req, res) => res.json({ data: roleDto(await service.getRole(req.params.id)) }));
const create = asyncHandler(async (req, res) => res.status(201).json({ data: roleDto(await service.createRole(req.body)) }));
const update = asyncHandler(async (req, res) => res.json({ data: roleDto(await service.updateRole(req.params.id, req.body)) }));
const remove = asyncHandler(async (req, res) => {
  await service.deleteRole(req.params.id);
  res.status(204).send();
});
const permissions = asyncHandler(async (req, res) => res.json({ data: (await service.getPermissions()).map((permission) => ({ id: permission.id, name: permission.name })) }));
const setPermissions = asyncHandler(async (req, res) => res.json({ data: roleDto(await service.setRolePermissions(req.params.id, req.body.permissionNames)) }));

module.exports = { list, get, create, update, remove, permissions, setPermissions };
