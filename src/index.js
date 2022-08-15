import express from "express";
import problemRouter from "./problems";

const app = express();
const PORT = 4000;

const handleHome = async (req, res) => {
  console.log("handleHome!!");
  return res.send("It's Home");
};

app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");
app.use(express.urlencoded({ extended: true })); // translates HTML form into javascript object (POST - req.body)
app.use(express.json()); // Backend understands the STRING and turn it into JS object
app.use("/problems", problemRouter);
app.get("/", handleHome);

const handleListen = () => console.log(`🎸 Server listening on PORT ${PORT}`);

app.listen(PORT, handleListen);
