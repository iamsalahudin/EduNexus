const { ValidationError } = require('joi');

function validate(schema) {
  return (req, res, next) => {
    const payload = {
      headers: req.headers,
      params: req.params,
      query: req.query,
      body: req.body
    };

    if (schema && typeof schema.validate === 'function') {
      const { error } = schema.validate(payload, { abortEarly: false, allowUnknown: true });
      if (error) {
        const details = error.details.map((d) => d.message);
        return res.status(400).json({ error: 'Validation error', details });
      }
      return next();
    }

    const details = [];
    const parts = ['headers', 'params', 'query', 'body'];
    for (const part of parts) {
      if (!schema?.[part] || typeof schema[part].validate !== 'function') continue;
      const { error } = schema[part].validate(payload[part], { abortEarly: false, allowUnknown: true });
      if (error) details.push(...error.details.map((d) => d.message));
    }

    if (details.length) {
      return res.status(400).json({ error: 'Validation error', details });
    }

    return next();
  };
}

module.exports = validate;
