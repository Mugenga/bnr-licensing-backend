const app = require('./app');
const { sequelize } = require('./db/models');
const env = require('./config/env');

async function start() {
  await sequelize.authenticate(); // fail fast when db is down.
  console.log('Database connection established successfully.');
  app.listen(env.port, () => {
    console.log(`Bank Licensing API listening on port ${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
