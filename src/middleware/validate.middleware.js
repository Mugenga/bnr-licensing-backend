const { BadRequestError } = require('../utils/errors');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) {
      return next(new BadRequestError(error.details.map((detail) => detail.message).join(', ')));
    }
    req[source] = value;
    return next();
  };
}

module.exports = validate;
