import mongoose from "mongoose";

const problemSchema = new mongoose.Schema({
  problemId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  level: { type: Number, required: true },
  isSolvable: { type: Boolean, required: true },
  isPartial: { type: Boolean, required: true },
  tags: [{ type: String, required: true }],
});

const Problem = mongoose.model("Problem", problemSchema);

export default Problem;
