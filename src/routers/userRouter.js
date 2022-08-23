import express from "express";
import axios from "axios";
import { getProfile } from "../controllers/userController";

const userRouter = express.Router();

userRouter.get("/:id", getProfile);

export default userRouter;
