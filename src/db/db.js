import mongoose from "mongoose";

mongoose.connect("mongodb://127.0.0.1:27017/dailyboj", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

const handleOpen = () => console.log("✅ Connected to DB");
db.on("error", (err) => console.log("DB Error", err));
db.once("open", handleOpen);
