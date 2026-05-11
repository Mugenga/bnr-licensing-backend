const path = require('path');
const multer = require('multer');
const { v4: uuid } = require('uuid');

const storage = multer.diskStorage({
  destination: path.resolve(process.cwd(), 'storage', 'documents'),
  // Use random file name so uploads dont overwrite each other.
  filename: (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`)
});

const uploadDocuments = multer({
  storage,
  limits: {
    // Backend also enforces 5MB, frontend is only convenience.
    fileSize: 5 * 1024 * 1024
  }
}).array('documents');

module.exports = { uploadDocuments };
