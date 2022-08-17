import "./db";
import "./models/User";
import express from "express";
import problemRouter from "./routers/problemRouter";
import userRouter from "./routers/userRouter";
import rootRouter from "./routers/rootRouter";

const app = express();
const PORT = 4000;

app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");
app.use(express.urlencoded({ extended: true })); // translates HTML form into javascript object (POST - req.body)
app.use(express.json()); // Backend understands the STRING and turn it into JS object
app.use("/", rootRouter);
app.use("/problems", problemRouter);
app.use("/static", express.static("assets"));

const handleListen = () => console.log(`🎸 Server listening on PORT ${PORT}`);

app.listen(PORT, handleListen);
