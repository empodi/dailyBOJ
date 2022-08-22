import express from "express";
import passport from "passport";
import { onlyPrivate, onlyPublic } from "../../middlewares";
import { setDBTag, setDBProblem } from "../controllers/dbController";
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

rootRouter.get("/dbProblem", setDBProblem);
rootRouter.get("/dbTag", setDBTag);

rootRouter.get("/", handleHome);
rootRouter.route("/join").all(onlyPublic).get(getJoin).post(postJoin);
//rootRouter.route("/login").get(getLogin).post(postLogin);
rootRouter
  .route("/login")
  .all(onlyPublic)
  .get(getLogin)
  .post(
    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/login",
    })
  );
rootRouter.get("/logout", onlyPrivate, getLogout);
export default rootRouter;
