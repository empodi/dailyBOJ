import User from "../models/User";
import axios from "axios";
import crypto from "crypto";
import passport from "passport";
import Tag from "../models/Tag";
import { levels } from "./options";

const LocalStrategy = require("passport-local").Strategy;

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

  const userExists = await User.exists({ userId });

  if (userExists) {
    return res.status(400).render("join", {
      errorMessage: "이미 존재하는 아이디입니다.",
    });
  }

  //console.log("userId", userId);
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

  try {
    for (let i = 1; i <= maxPage; i++) {
      baseOption.params.page = i;
      const result = await axios.request(baseOption);
      if (result.status != 200) res.status(400).render("join");
      const { items } = result.data;
      if (items.length === 0) break;
      for (let item of items) {
        totalSolved.push(Number(item.problemId));
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(400).render("join");
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
    //return res.redirect("/login");
  } catch (err) {
    console.log(err);
    return res.status(400).render("join");
  }
};

const createLoginHashedPassword = (userId, plainPassword) =>
  // eslint-disable-next-line no-async-promise-executor
  new Promise(async (resolve, reject) => {
    const salt = await User.findOne({ userId: userId }).then(
      (result) => result.salt
    );
    crypto.pbkdf2(plainPassword, salt, 9999, 64, "sha512", (err, key) => {
      if (err) reject(err);
      resolve(key.toString("base64"));
    });
  });

export const getLogin = (req, res) => {
  //console.log("Login!!!");
  return res.render("login");
};

passport.serializeUser(function (userId, done) {
  //console.log("serializeUser", userId);
  done(null, userId);
});

passport.deserializeUser(function (userId, done) {
  //console.log("deserializeUser", userId);
  done(null, userId);
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "userId" /** try _id */,
      passwordField: "password",
    },
    async (userId, password, done) => {
      try {
        //console.log("LocalStrategy", userId, password);
        const user = await User.findOne({ userId });

        if (!user) {
          return done(null, false);
        }
        const dbPassword = user.password;
        const hashedLoginPassword = await createLoginHashedPassword(
          userId,
          password
        );
        if (dbPassword !== hashedLoginPassword) {
          //console.log(dbPassword);
          //console.log(hashedLoginPassword);
          //console.log("different password");
          return done(null, false);
        }
        console.log("Login Done");
        return done(null, user.userId);
      } catch (err) {
        console.log(err);
        return done(err);
      }
    }
  )
);

export const getLogout = async (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    } else {
      req.session.user = null;
      res.locals.loggedInUser = req.session.user;
      req.session.loggedIn = false;
      res.redirect("/");
    }
  });
};

export const getProfile = async (req, res, next) => {
  //console.log("req.params:", req.params);
  const userId = req.params.id;
  const user = await User.findOne({ userId });
  const dbTag = await Tag.find({});
  if (!user) {
    console.log(`❌ Failed to find ${userId}`);
    return res.render("home");
  }

  const userLevel = user.levels;
  let koTag = [];
  let levelName = [];

  user.tags.forEach((utag) => {
    const tagInfo = dbTag.find((dtag) => String(dtag.key) === String(utag));
    koTag.push(tagInfo.koName);
  });

  userLevel.forEach((ulevel) => {
    const levelInfo = levels.find(
      (level) => Number(level.num) === Number(ulevel)
    );
    levelName.push(levelInfo.tier);
  });

  //console.log(koTag);
  return res.render("profile", { user, koTag, levelName });
};

export const home = async (req, res) => {
  //console.log(req.user);
  const userId = req.user;
  if (userId === undefined) {
    return res.render("home", { loginMessage: "로그인을 먼저 해주세요." });
  }

  const user = await User.findOne({ userId });

  if (!user) {
    console.log(`❌ ${userId}의 정보를 가져오는데 실패했습니다.`);
    return res.render("home", { loginMessage: "로그인을 먼저 해주세요." });
  }
  if (user.problemSet.length === 0) {
    return res.render("home", {
      loginMessage: "문제 범위를 먼저 설정해주세요.",
    });
  }
  if (user.todaySolved.length === 0) {
    return res.render("home", { loginMessage: "추천 문제가 없습니다." });
  }

  const { todaySolved } = user;

  console.log(todaySolved);

  console.log(user.userId);

  return res.render("home", { todaySolved });
};
