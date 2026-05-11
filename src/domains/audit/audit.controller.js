const service = require('./audit.service');
const asyncHandler = require('../../utils/asyncHandler');
const { auditDto } = require('../../utils/serialize');

const getApplicationAuditLogs = asyncHandler(async (req, res) => {
  const logs = await service.getApplicationAuditLogs(req.params.id, req.user);
  res.json({ data: logs.map(auditDto) });
});

module.exports = { getApplicationAuditLogs };
