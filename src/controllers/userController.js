import User from "../models/User";
import axios from "axios";
import crypto from "crypto";

const baseOption = {
  method: "GET",
  url: "https://solved.ac/api/v3/search/problem",
  params: { query: "" },
  headers: { "Content-Type": "application/json" },
};

const createSalt = () =>
  new Promise((resolve, reject) => {
    crypto.randomBytes(64, (err, buf) => {
      if (err) reject(err);
      resolve(buf.toString("base64"));
    });
  });

const createHashedPassword = (plainPassword) =>
  // eslint-disable-next-line no-async-promise-executor
  new Promise(async (resolve, reject) => {
    const salt = await createSalt();
    crypto.pbkdf2(plainPassword, salt, 9999, 64, "sha512", (err, key) => {
      if (err) reject(err);
      resolve({ hashedPassword: key.toString("base64"), salt });
    });
  });

export const getJoin = (req, res) => {
  return res.render("join");
};

export const postJoin = async (req, res) => {
  const { userId, password, confirmPassword, email } = req.body;
  console.log(userId, password, confirmPassword, email);

  console.log("userId", userId);
  if (userId.length < 3) {
    return res.status(400).render("join");
  }
  if (password !== confirmPassword) {
    return res.status(400).render("join");
  }

  const { hashedPassword, salt } = await createHashedPassword(password);

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

  try {
    await User.create({
      userId,
      password: hashedPassword,
      salt,
      email,
      totalSolved,
    });
    return res.redirect("/login");
  } catch (err) {
    console.log(err);
    return res.status(400).render("join");
  }
};
