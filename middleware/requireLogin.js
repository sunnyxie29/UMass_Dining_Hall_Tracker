export const requireLogin = (req, res, next) => {
  if (!req.user) {
    return next(Object.assign(new Error("Login required."), { status: 401 }));
  }

  next();
};
