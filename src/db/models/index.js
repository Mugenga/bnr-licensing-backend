const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../../config/database')[process.env.NODE_ENV || 'development'];

let sequelize;

if (process.env.NODE_ENV === 'test') {
  const { newDb } = require('pg-mem');
  const mem = newDb({ autoCreateForeignKeyIndices: true });
  mem.public.registerFunction({ name: 'current_database', returns: 'text', implementation: () => 'test' });
  sequelize = new Sequelize('postgres://test:test@localhost:5432/test', {
    ...config,
    dialectModule: mem.adapters.createPg()
  });
} else {
  sequelize = config.url
    ? new Sequelize(config.url, config)
    : new Sequelize(config.database || 'test', config.username || '', config.password || '', config);
}

const db = { sequelize, Sequelize };

fs.readdirSync(__dirname)
  .filter((file) => file.endsWith('.model.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.values(db)
  .filter((model) => model && model.associate)
  .forEach((model) => model.associate(db));

module.exports = db;
