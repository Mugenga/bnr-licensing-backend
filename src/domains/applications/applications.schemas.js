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

const requiredDocumentsSchema = Joi.object({
  licenseType: Joi.string().max(100).required(),
  documents: Joi.array().items(Joi.object({
    key: Joi.string().max(100).pattern(/^[a-z0-9_]+$/).required(),
    label: Joi.string().max(150).required()
  })).required()
});

module.exports = { createApplicationSchema, requestDocumentsSchema, decisionSchema, requiredDocumentsSchema };
