// backend/src/middleware/errorHandler.js
'use strict';

const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status  = err.status || 500;
  const message = err.message || 'Internal server error';
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ error: message });
}

function httpError(status, message) {
  const err  = new Error(message);
  err.status = status;
  return err;
}

module.exports = { validate, errorHandler, httpError };
