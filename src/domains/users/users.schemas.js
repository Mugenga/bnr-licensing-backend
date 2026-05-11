const Joi = require('joi');

const createUserSchema = Joi.object({
  fullName: Joi.string().max(150).required(),
  email: Joi.string().email().max(150).required(),
  password: Joi.string().min(8).required(),
  roleId: Joi.string().guid().required(),
  organizationName: Joi.string().max(200).allow(null, ''),
  status: Joi.string().valid('active', 'inactive').default('active')
});

const updateUserSchema = Joi.object({
  fullName: Joi.string().max(150),
  email: Joi.string().email().max(150),
  roleId: Joi.string().guid(),
  organizationName: Joi.string().max(200).allow(null, ''),
  status: Joi.string().valid('active', 'inactive')
}).min(1);

const statusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive').required()
});

module.exports = { createUserSchema, updateUserSchema, statusSchema };
