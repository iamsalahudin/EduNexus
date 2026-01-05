const { ValidationError } = require('joi');

function validate(schema) {
  return (req, res, next) => {
    const toValidate = {};
    if (schema.headers) toValidate.headers = req.headers;
    if (schema.params) toValidate.params = req.params;
    if (schema.query) toValidate.query = req.query;
    if (schema.body) toValidate.body = req.body;

    const { error } = schema.validate(toValidate, { abortEarly: false, allowUnknown: true });
    if (error) {
      const details = error.details.map((d) => d.message);
      return res.status(400).json({ error: 'Validation error', details });
    }
    next();
  };
}

module.exports = validate;
