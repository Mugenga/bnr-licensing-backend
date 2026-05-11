const service = require('./documents.service');
const asyncHandler = require('../../utils/asyncHandler');
const { documentDto } = require('../../utils/serialize');

const upload = asyncHandler(async (req, res) => {
  const documentTypes = Array.isArray(req.body.documentTypes)
    ? req.body.documentTypes
    : req.body.documentTypes ? [req.body.documentTypes] : [];
  const documents = await service.uploadDocuments(req.params.id, req.files, req.user, documentTypes);
  res.status(201).json({ data: documents.map(documentDto) });
});

const list = asyncHandler(async (req, res) => {
  const documents = await service.getApplicationDocuments(req.params.id, req.user);
  res.json({ data: documents.map(documentDto) });
});

const download = asyncHandler(async (req, res) => {
  const result = await service.getDownload(req.params.id, req.user);
  res.download(result.path, result.document.original_name);
});

module.exports = { upload, list, download };
