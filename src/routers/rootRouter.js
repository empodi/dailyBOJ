import express from "express";
import { getJoin, postJoin } from "../controllers/userController";

const rootRouter = express.Router();

const handleHome = async (req, res) => {
  console.log("handleHome!!");
  return res.send("It's Home");
};

rootRouter.get("/", handleHome);
rootRouter.route("/join").get(getJoin).post(postJoin);

export default rootRouter;
