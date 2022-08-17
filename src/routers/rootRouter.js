import express from "express";
import { getJoin } from "../controllers/userController";

const rootRouter = express.Router();

const handleHome = async (req, res) => {
  console.log("handleHome!!");
  return res.send("It's Home");
};

rootRouter.get("/", handleHome);
rootRouter.get("/join", getJoin);

export default rootRouter;
