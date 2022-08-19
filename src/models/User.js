import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  salt: { type: String, required: true },
  email: { type: String, require: true, unique: true },
  todaySolved: [{ type: Number }],
  tags: [{ type: String }],
  levels: [{ type: String }],
  totalSolved: [{ type: Number }],
  problemSet: [{ type: Number }],
});

const User = mongoose.model("User", userSchema);

export default User;
