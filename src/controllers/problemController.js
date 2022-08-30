import axios from "axios";
import Problem from "../models/Problem";
import Tag from "../models/Tag";
import User from "../models/User";
import { levels, majorTags, Options } from "../utils/options";
import {
  getThreeRandom,
  onlyNumbers,
  buildParams,
  checkContainsMajorTags,
  isArrayEqual,
  buildQuery,
  getAllTags,
} from "../utils/util";
const fs = require("fs");

const findTagsFromDB = async () => {
  try {
    const dbTag = await Tag.find({});
    if (checkContainsMajorTags(dbTag) && dbTag.length > 190) {
      console.log("⭐️ Got Tags from DB:", dbTag.length);
      return dbTag;
    } else {
      return [];
    }
  } catch (err) {
    console.log(err);
    return [];
  }
};

const findTagsFromFS = async () => {
  try {
    if (fs.existsSync(process.cwd() + "/src/db/tag.json")) {
      const fileData = fs.readFileSync(process.cwd() + "/src/db/tag.json", {
        encoding: "utf-8",
        flag: "r",
      });
      if (fileData.length === 0) return [];
      const fileTag = JSON.parse(fileData);
      return fileTag.tags;
    }
    return [];
  } catch (err) {
    console.log(err);
    return [];
  }
};

const buildLevelTagList = async (userId) => {
  try {
    let tagList = [];
    tagList = await findTagsFromDB();
    if (tagList.length < 190) {
      tagList = await findTagsFromFS();
      console.log("⭐️ Got tags from FS:", tagList.length);
    }
    if (tagList.length < 190) {
      tagList = await getAllTags();
      console.log("⭐️ Got tags from API:", tagList.length);
    }
    if (tagList.length < 190) {
      console.log("❌ Cannot get Tags from DB nor API");
      return [];
    }

    const user = await User.findOne({ userId });
    //console.log(user);
    const dbTag = user ? user.tags : [];
    const dbLevels = user ? user.levels : [];

    tagList.forEach((tag) => {
      if (dbTag.length > 0) {
        if (dbTag.includes(tag.key)) tag.isMajor = true;
        else tag.isMajor = false;
      } else {
        if (majorTags.includes(tag.key)) tag.isMajor = true;
        else tag.isMajor = false;
      }
    });

    levels.forEach((level) => {
      if (dbLevels.includes(String(level.num))) {
        level.isChecked = true;
      } else level.isChecked = false;
    });

    const levelTagList = [];
    /* levels를 꼭 tagList 보다 먼저 push!! */
    levelTagList.push(levels);
    levelTagList.push(tagList);
    return levelTagList;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const getProblemSettings = async (req, res) => {
  try {
    const userId = req.params.id;
    const levelTagList = await buildLevelTagList(userId);
    if (
      levelTagList.length === 2 &&
      levelTagList[0].length >= levels.length &&
      levelTagList[1].length > 190
    ) {
      return res.render("problem", { levelTagList });
    } else {
      console.log("❌ Cannot get Tags from DB nor Solved.ac");
      return res.status(400).render("home");
    }
  } catch (err) {
    console.log(err);
    return res.status(400).render("home");
  }
};

const filterDBProblem = async (levelnums, tagSet) => {
  try {
    const dbProblemCnt = await Problem.find().count();
    if (dbProblemCnt < 2900) return [];
    let filtered = [];
    const levelSet = new Set(levelnums);
    const result = await Problem.find().in("level", levelnums);
    //console.log("filterDB_Problem:", result.length);
    for (const item of result) {
      if (levelSet.has(item.level)) {
        if (item.tags.every((tag) => tagSet.has(tag))) {
          filtered.push(item.problemId);
        }
      }
    }
    return filtered;
  } catch (err) {
    console.log(err);
    return [];
  }
};

const filterFSProblem = async (levelnums, tagSet) => {
  try {
    if (fs.existsSync(process.cwd() + "/src/db/problem.json")) {
      let filtered = [];
      const levelSet = new Set(levelnums);
      const fileData = fs.readFileSync(process.cwd() + "/src/db/problem.json", {
        encoding: "utf-8",
        flag: "r",
      });
      if (fileData.length === 0) return [];
      const fileProblem = JSON.parse(fileData);
      if (fileProblem.problems.length < fileProblem.counts) return [];

      for (const item of fileProblem.problems) {
        if (levelSet.has(item.level)) {
          if (item.tags.every((tag) => tagSet.has(tag))) {
            filtered.push(item.problemId);
          }
        }
      }
      return filtered;
    }
    return [];
  } catch (err) {
    console.log(err);
    return [];
  }
};

const filterAPIProblem = async (levelnums, tagSet) => {
  try {
    let filtered = [];
    const levelSet = new Set(levelnums);
    const paramsArray = buildParams(levelnums);
    buildQuery(levelnums);

    for (const params of paramsArray) {
      //console.log(queryObj);

      for (let i = 1; i <= params.page; i++) {
        const queryObj = Options.baseSearchProblemOption;
        queryObj.params.page = String(i);
        queryObj.params.query = params.query;
        //console.log(queryObj.params.query);
        const result = await axios.request(queryObj);
        if (result.status === 200) {
          const { items } = result.data;
          //console.log(items.length);
          if (items.length === 0) break;

          for (const item of items) {
            //console.log(item.problemId);
            if (
              levelSet.has(item.level) &&
              item.isSolvable &&
              !item.isPartial
            ) {
              // 레벨은 더블 체킹, 채점 가능 여부 확인, 서브 태스크 및 부분 점수 문제는 제외
              const tagKeys = item.tags.map((elem) => elem.key);
              if (tagKeys.every((tag) => tagSet.has(tag))) {
                filtered.push(String(item.problemId));
              }
            }
          }
        }
      }
    }
    return filtered;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const postProblemSettings = async (req, res) => {
  const settings = Object.values(req.body);
  let levelnums = [];
  let tags = [];
  console.log("POST PROBLEM USER:", req.params.id);
  settings.forEach((elem) => {
    if (onlyNumbers(elem)) levelnums.push(Number(elem));
    else tags.push(elem);
  });
  levelnums.sort((a, b) => a - b);

  const tagSet = new Set(tags);

  try {
    let userProblems = await filterDBProblem(levelnums, tagSet);
    if (userProblems.length > 0) {
      console.log("⭐️ Got Problems from DB:", userProblems.length);
    } else {
      userProblems = await filterFSProblem(levelnums, tagSet);
      if (userProblems.length > 0) {
        console.log("⭐️ Got Problems from FS:", userProblems.length);
      } else {
        userProblems = await filterAPIProblem(levelnums, tagSet);
        if (userProblems.length > 0) {
          console.log("⭐️ Got Problems from API:", userProblems.length);
        }
      }
    }

    const filter = { userId: req.user };
    const dbUser = await User.findOne(filter);

    if (!dbUser) {
      console.log("Cannot find User:", req.user);
      return res.status(200).redirect("/");
    }

    if (
      isArrayEqual(dbUser.tags, tags) &&
      isArrayEqual(dbUser.levels, levelnums) &&
      dbUser.problemSet.length === userProblems.length &&
      dbUser.todaySolved.length === 3
    ) {
      console.log(`✅ ${req.user}'s problemSet already upto date.`);
      return res.status(200).redirect("/");
    }

    if (userProblems.length === 0) {
      console.log("❌ Failed to Filter Problems");
      return res.status(400).redirect("/");
    }
    if (userProblems.length < 100) {
      // alert to the user that the number of problems is too small
      console.log("❗️ Number of problems less than 100!!");
    }

    // emtpy the User-problemSet array
    // console.log("problemController user:", req.user);

    const update = { problemSet: userProblems, tags: tags, levels: levelnums };
    await User.findOneAndUpdate(filter, update);

    //console.log(dbUser.problemSet);
    //console.log("problemSet from DB: ", dbUser.problemSet.length);

    const first = new Set(dbUser.problemSet);
    const second = new Set(dbUser.totalSolved);
    const candidate = [...first].filter((elem) => !second.has(elem));

    const daily = getThreeRandom(candidate);
    const review = getThreeRandom(dbUser.totalSolved);
    console.log(daily);
    console.log(review);

    await User.findOneAndUpdate(filter, { todaySolved: daily, review: review });

    //console.info(new Blob([JSON.stringify(filtered)]).size);
    return res.status(200).redirect("/");
  } catch (err) {
    console.log(err);
    const levelTagList = await buildLevelTagList(req.params.id);
    if (
      levelTagList.length === 2 &&
      levelTagList[0].length >= levels.length &&
      levelTagList[1].length > 190
    ) {
      return res.render("problem", { levelTagList });
    } else {
      console.log("❌ Cannot get Tags from DB nor Solved.ac");
      return res.status(400).render("home");
    }
  }
};
