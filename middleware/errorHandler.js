export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = status === 500 ? 'Something went wrong on the server.' : err.message;

  if (req.get('HX-Request') === 'true') {
    res.set({ 'HX-Retarget': '#form-error', 'HX-Reswap': 'innerHTML' });
    return res.status(status).render('partials/error', { message });
  }

  res.status(status).json({ error: message });
};
