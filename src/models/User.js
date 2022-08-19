import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  salt: { type: String, required: true },
  email: { type: String, require: true, unique: true },
  totalSolved: [{ type: Number }],
  todaySolved: [{ type: Number }],
  problemSet: [{ type: Number }],
});

const User = mongoose.model("User", userSchema);

export default User;
