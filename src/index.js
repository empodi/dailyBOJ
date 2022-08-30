import "dotenv/config";
import "./db/db";
import "./models/User";
import "./utils/schedule";
import express from "express";
import morgan from "morgan";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import MongoStore from "connect-mongo";
import problemRouter from "./routers/problemRouter";
import userRouter from "./routers/userRouter";
import rootRouter from "./routers/rootRouter";
import { localsMiddleware } from "./middlewares";
import cookieParser from "cookie-parser";
import "regenerator-runtime";

const app = express();
const logger = morgan("dev");
const CookieStore = MongoStore(session);
const PORT = 4000;

app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");

app.use(logger);
app.use(express.json()); // Backend understands the STRING and turn it into JS object
app.use(express.urlencoded({ extended: true })); // translates HTML form into javascript object (POST - req.body)
app.use(cookieParser());

app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new CookieStore({
      mongooseConnection: mongoose.connection,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(localsMiddleware);
app.use("/", rootRouter);
app.use("/users", userRouter);
app.use("/problems", problemRouter);
app.use("/static", express.static("assets"));

const handleListen = () => console.log(`🎸 Server listening on PORT:${PORT}`);

app.listen(PORT, handleListen);
