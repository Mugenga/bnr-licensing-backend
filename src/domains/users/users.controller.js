const service = require('./users.service');
const asyncHandler = require('../../utils/asyncHandler');
const { userDto } = require('../../utils/serialize');

const list = asyncHandler(async (req, res) => {
  const result = await service.getUsers();
  res.json({ data: result.rows.map(userDto), meta: { page: 1, limit: result.count, total: result.count } });
});

const get = asyncHandler(async (req, res) => res.json({ data: userDto(await service.getUser(req.params.id)) }));
const create = asyncHandler(async (req, res) => res.status(201).json({ data: userDto(await service.createUser(req.body)) }));
const update = asyncHandler(async (req, res) => res.json({ data: userDto(await service.updateUser(req.params.id, req.body)) }));
const updateStatus = asyncHandler(async (req, res) => res.json({ data: userDto(await service.updateStatus(req.params.id, req.body.status)) }));

module.exports = { list, get, create, update, updateStatus };
