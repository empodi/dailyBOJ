import express from "express";

const rootRouter = express.Router();

const handleHome = async (req, res) => {
  console.log("handleHome!!");
  return res.send("It's Home");
};

rootRouter.get("/", handleHome);
rootRouter.get("/join", (req, res) => res.send("JOIN NOW"));

export default rootRouter;
