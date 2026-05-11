const service = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { userDto } = require('../../utils/serialize');

// Authenticate user and return their token and info
const login = asyncHandler(async (req, res) => {
  const result = await service.login(req.body);
  res.json({ data: { token: result.token, user: userDto(result.user) } });
});

// Register a new user and return their token and info
const register = asyncHandler(async (req, res) => {
  const result = await service.register(req.body);
  res.status(201).json({ data: { token: result.token, user: userDto(result.user) } });
});

// Get current authenticated user's info
const me = asyncHandler(async (req, res) => {
  res.json({ data: userDto(await service.me(req.user)) });
});

module.exports = { login, register, me };
