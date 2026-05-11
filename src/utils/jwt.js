const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Sign a token with user details and return it to frontend for authentication
function signToken(user) {
  return jwt.sign(
    { userId: user.id, roleId: user.role_id, roleName: user.Role?.name || user.roleName },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn } // Token expiration time from environment variable
  );
}

// Verify token from frontend and return decoded payload or throw an error if invalid/expired
function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signToken, verifyToken };
