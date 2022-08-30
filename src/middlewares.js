export const localsMiddleware = (req, res, next) => {
  res.locals.loggedIn = req.user === undefined ? false : true;
  res.locals.loggedInUser = req.user || null;
  //console.log("From Middleware:", res.locals.loggedIn);
  //console.log(req.cookies);
  next();
};

/** for those who are NOT logged in */
export const onlyPublic = (req, res, next) => {
  if (req.isAuthenticated()) {
    res.redirect("/");
  } else {
    next();
  }
};

/** for those whoe are logged in */
export const onlyPrivate = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("login");
  }
};
