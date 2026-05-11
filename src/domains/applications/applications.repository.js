const { Op } = require('sequelize');
const { Application, User } = require('../../db/models');

const includeApplicant = [{ model: User, as: 'Applicant', attributes: ['id', 'email', 'full_name', 'organization_name'] }];

async function findAndCount({ where, limit, offset }) {
  return Application.findAndCountAll({
    where,
    include: includeApplicant,
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });
}

async function findById(id, options = {}) {
  return Application.findByPk(id, { include: includeApplicant, ...options });
}

async function findLocked(id, transaction) {
  return Application.findByPk(id, {
    transaction,
    lock: transaction.LOCK?.UPDATE || true
  });
}

async function create(data, options = {}) {
  return Application.create(data, options);
}

async function countByYear(year, transaction) {
  return Application.count({
    where: {
      reference_number: { [Op.like]: `APP-${year}-%` }
    },
    transaction
  });
}

module.exports = { findAndCount, findById, findLocked, create, countByYear };
