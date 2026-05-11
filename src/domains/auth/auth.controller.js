const service = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { userDto } = require('../../utils/serialize');

const login = asyncHandler(async (req, res) => {
  const result = await service.login(req.body);
  res.json({ data: { token: result.token, user: userDto(result.user) } });
});

const register = asyncHandler(async (req, res) => {
  const result = await service.register(req.body);
  res.status(201).json({ data: { token: result.token, user: userDto(result.user) } });
});

const me = asyncHandler(async (req, res) => {
  res.json({ data: userDto(await service.me(req.user)) });
});

module.exports = { login, register, me };
