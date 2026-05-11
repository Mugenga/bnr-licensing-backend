const Joi = require('joi');

const createRoleSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().allow(null, ''),
  permissionNames: Joi.array().items(Joi.string()).default([])
});

const updateRoleSchema = Joi.object({
  name: Joi.string().max(100),
  description: Joi.string().allow(null, '')
}).min(1);

const rolePermissionsSchema = Joi.object({
  permissionNames: Joi.array().items(Joi.string()).required()
});

module.exports = { createRoleSchema, updateRoleSchema, rolePermissionsSchema };
