const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signToken(user) {
  return jwt.sign(
    { userId: user.id, roleId: user.role_id, roleName: user.Role?.name || user.roleName },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn } // expiry comes from env.
  );
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signToken, verifyToken };
