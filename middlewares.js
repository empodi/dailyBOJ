export const localsMiddleware = (req, res, next) => {
  res.locals.loggedIn = req.user === undefined ? false : true;
  res.locals.loggedInUser = req.user || null;
  next();
};
