const { User, Role } = require('../../db/models');

const includeRole = [{ model: Role }];

async function findAll() {
  return User.findAndCountAll({ include: includeRole, order: [['created_at', 'DESC']] });
}

async function findById(id) {
  return User.findByPk(id, { include: includeRole });
}

async function create(data) {
  return User.create(data);
}

async function update(user, data) {
  return user.update(data);
}

module.exports = { findAll, findById, create, update };
