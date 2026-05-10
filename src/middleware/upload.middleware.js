const path = require('path');
const multer = require('multer');
const { v4: uuid } = require('uuid');

const storage = multer.diskStorage({
  destination: path.resolve(process.cwd(), 'storage', 'documents'),
  filename: (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`)
});

const uploadDocuments = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
}).array('documents');

module.exports = { uploadDocuments };
