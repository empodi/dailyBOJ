import express from "express";
import { onlyPrivate } from "../../middlewares";
import {
  getProblemSettings,
  postProblemSettings,
} from "../controllers/problemController";

const problemRouter = express.Router();

problemRouter
  .route("/:id")
  .all(onlyPrivate)
  .get(getProblemSettings)
  .post(postProblemSettings);
export default problemRouter;
