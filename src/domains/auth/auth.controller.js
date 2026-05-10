const service = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { userDto } = require('../../utils/serialize');

const login = asyncHandler(async (req, res) => {
  const result = await service.login(req.body);
  res.json({ data: { token: result.token, user: userDto(result.user) } });
});

const me = asyncHandler(async (req, res) => {
  res.json({ data: userDto(await service.me(req.user)) });
});

module.exports = { login, me };
