const app = require('./app');
const { sequelize } = require('./db/models'); // Import sequelize instance
const env = require('./config/env'); // Import environment variables

async function start() {
  await sequelize.authenticate(); // Ensure database connection is established
  console.log('Database connection established successfully.');
  app.listen(env.port, () => {
    console.log(`Bank Licensing API listening on port ${env.port}`);
  });
}

// Start the server and handle any startup errors
start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
