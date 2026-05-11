const bcrypt = require('bcryptjs');

// Hash password before saving to database and return the hashed value
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

// Compare user inputted password with stored hash and return true if they match, false otherwise
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { hashPassword, comparePassword };
