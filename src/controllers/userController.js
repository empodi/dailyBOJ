import User from "../models/User";
import axios from "axios";

const baseOption = {
  method: "GET",
  url: "https://solved.ac/api/v3/search/problem",
  params: { query: "" },
  headers: { "Content-Type": "application/json" },
};

export const getJoin = (req, res) => {
  return res.render("join");
};

export const postJoin = async (req, res) => {
  const { userId, password, confirmPassword, email } = req.body;
  console.log(userId, password, confirmPassword, email);

  baseOption.params.query = `solved_by:${userId}`;

  let totalSolved = [];
  const maxPage = 300;
  let i;
  for (i = 1; i <= maxPage; i++) {
    baseOption.params.page = i;
    const result = await axios.request(baseOption);
    if (result.status !== 200) res.status(400).render("join");
    const { items } = result.data;
    if (items.length === 0) break;
    for (let item of items) {
      totalSolved.push(Number(item.problemId));
    }
  }
  console.log(i);

  try {
    await User.create({
      userId,
      password,
      email,
      totalSolved,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).render("join");
  }

  return res.send("LOGIN POST");
};
