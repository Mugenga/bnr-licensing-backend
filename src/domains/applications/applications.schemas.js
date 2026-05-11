const Joi = require('joi');

const createApplicationSchema = Joi.object({
  institutionName: Joi.string().max(200).required(),
  licenseType: Joi.string().max(100).required(),
  description: Joi.string().allow(null, '')
});

const requestDocumentsSchema = Joi.object({
  message: Joi.string().min(3).required()
});

const decisionSchema = Joi.object({
  note: Joi.string().min(3).required()
});

module.exports = { createApplicationSchema, requestDocumentsSchema, decisionSchema };
