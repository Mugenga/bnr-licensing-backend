const service = require('./applications.service');
const asyncHandler = require('../../utils/asyncHandler');
const { applicationDto } = require('../../utils/serialize');

const list = asyncHandler(async (req, res) => {
  const result = await service.getApplications(req.query, req.user);
  res.json({ data: result.rows.map(applicationDto), meta: { page: result.page, limit: result.limit, total: result.count } });
});

const get = asyncHandler(async (req, res) => res.json({ data: applicationDto(await service.getApplicationById(req.params.id, req.user)) }));
const create = asyncHandler(async (req, res) => res.status(201).json({ data: applicationDto(await service.createApplication(req.body, req.user)) }));
const submit = asyncHandler(async (req, res) => res.json({ data: applicationDto(await service.submitApplication(req.params.id, req.user)) }));
const review = asyncHandler(async (req, res) => res.json({ data: applicationDto(await service.startReview(req.params.id, req.user)) }));
const requestDocuments = asyncHandler(async (req, res) => res.json({ data: applicationDto(await service.requestDocuments(req.params.id, req.user, req.body.message)) }));
const resubmit = asyncHandler(async (req, res) => res.json({ data: applicationDto(await service.resubmitApplication(req.params.id, req.user)) }));
const pendingApproval = asyncHandler(async (req, res) => res.json({ data: applicationDto(await service.markPendingApproval(req.params.id, req.user)) }));
const approve = asyncHandler(async (req, res) => res.json({ data: applicationDto(await service.approveApplication(req.params.id, req.user, req.body.note)) }));
const reject = asyncHandler(async (req, res) => res.json({ data: applicationDto(await service.rejectApplication(req.params.id, req.user, req.body.note)) }));

module.exports = { list, get, create, submit, review, requestDocuments, resubmit, pendingApproval, approve, reject };
