require('dotenv').config();

const base = {
  logging: false,
  define: {
    underscored: true
  }
};

const config = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    ...base
  },
  test: {
    dialect: 'postgres',
    ...base
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    ...base
  }
};

module.exports = config;
