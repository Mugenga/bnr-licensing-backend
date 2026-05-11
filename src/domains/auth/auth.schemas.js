const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const registerSchema = Joi.object({
  fullName: Joi.string().min(2).max(150).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  organizationName: Joi.string().min(2).max(200).required()
});

module.exports = { loginSchema, registerSchema };
