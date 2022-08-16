import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, require: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  totalSolved: [{ type: Number }],
  todaySolved: [{ type: Number }],
});

const User = mongoose.model("User", userSchema);

export default User;
