export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Something went wrong on the server.' : err.message,
  });
};