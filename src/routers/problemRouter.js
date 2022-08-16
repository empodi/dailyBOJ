import express from "express";
import {
  getProblemSettings,
  postProblemSettings,
} from "../controllers/problemController";

const problemRouter = express.Router();

problemRouter.route("/").get(getProblemSettings).post(postProblemSettings);
export default problemRouter;
