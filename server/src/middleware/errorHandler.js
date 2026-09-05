const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  let message = err.isOperational ? err.message : 'Something went wrong. Please try again.';

  // Postgres error codes — see https://www.postgresql.org/docs/current/errcodes-appendix.html
  if (err.code === '23505') {
    statusCode = 409;
    message = 'A record with these details already exists.';
  }
  if (err.code === '23503') {
    statusCode = 400;
    message = 'That references a record that does not exist.';
  }
  if (err.code === '23502') {
    statusCode = 400;
    message = 'A required field is missing.';
  }
  if (err.code === '22P02') {
    statusCode = 400;
    message = 'Invalid identifier.';
  }
  if (err.code === '23514') {
    statusCode = 400;
    message = 'That value is not allowed for this field.';
  }

  if (process.env.NODE_ENV !== 'test') {
    if (err.isOperational) {
      // Expected 4xx (bad login, expired session, missing field, etc.) —
      // a one-liner is enough; a full stack trace here is just noise.
      console.warn(`[${statusCode}] ${req.method} ${req.originalUrl} — ${message}`);
    } else {
      console.error(err);
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
