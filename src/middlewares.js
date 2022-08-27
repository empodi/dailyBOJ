let userAccessMap = new Map();
const cleanUpFrequency = 5 * 1000;
const cleanUpTarget = 100 * 1000;

export const localsMiddleware = (req, res, next) => {
  res.locals.loggedIn = req.user === undefined ? false : true;
  res.locals.loggedInUser = req.user || null;
  //console.log("From Middleware:", res.locals.loggedIn);
  //console.log(req.cookies);
  if (res.locals.loggedIn && res.locals.loggedInUser) {
    //console.log(req.user);
    userAccessMap.set(res.locals.loggedInUser, Date.now());
  }
  next();
};

/*
setInterval(() => {
  let now = Date.now();
  for (let [id, lastAccess] of userAccessMap.entries()) {
    if (now - lastAccess > cleanUpTarget) {
      // delete users who haven't been here in a long time
      userAccessMap.delete(id);
    }
  }
  console.log(userAccessMap);
}, cleanUpFrequency);
*/

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
