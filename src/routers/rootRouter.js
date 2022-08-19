import express from "express";
import passport from "passport";
import {
  getJoin,
  getLogin,
  getLogout,
  postJoin,
} from "../controllers/userController";

const rootRouter = express.Router();

const handleHome = async (req, res) => {
  //console.log("handleHome!!");
  return res.render("home");
};

rootRouter.get("/", handleHome);
rootRouter.route("/join").get(getJoin).post(postJoin);
//rootRouter.route("/login").get(getLogin).post(postLogin);
rootRouter.get("/login", getLogin);
rootRouter.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);
rootRouter.get("/logout", getLogout);
export default rootRouter;
