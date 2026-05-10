const { AppError } = require('../utils/errors');

function errorMiddleware(error, req, res, next) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code
      }
    });
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ error: { message: 'Record already exists.', code: 'CONFLICT' } });
  }

  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: { message: error.errors[0].message, code: 'BAD_REQUEST' } });
  }

  const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message;
  return res.status(500).json({ error: { message, code: 'INTERNAL_SERVER_ERROR' } });
}

module.exports = errorMiddleware;
