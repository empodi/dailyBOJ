import axios from "axios";
import Problem from "../models/Problem";
import Tag from "../models/Tag";
import User from "../models/User";
import {
  silverOptions,
  goldOptions,
  platinumOptions,
  levels,
  majorTags,
  Options,
} from "../utils/options";
import {
  getThreeRandom,
  onlyNumbers,
  buildQuery,
  checkContainsMajorTags,
} from "../utils/util";

/*
const getSilver = async () => {
  let sArray = [];

  const promises = silverOptions.map(async (silverOption) => {
    const result = await axios.request(silverOption);
    if (result.status == 200) {
      const silverObjList = result.data.items;

      silverObjList.forEach((elem) => {
        let silver = new Object();
        silver.problemId = elem.problemId;
        silver.title = elem.titleKo;
        silver.level = elem.level;
        silver.tags = [];
        elem.tags.forEach((tag) => {
          silver.tags.push(tag.key);
        });
        sArray.push(silver);
      });
    }
  });
  await Promise.all(promises);

  return sArray;
};

const getGold = async () => {
  let gArray = [];

  const promises = goldOptions.map(async (goldOption) => {
    const result = await axios.request(goldOption);
    if (result.status == 200) {
      const goldObjList = result.data.items;

      goldObjList.forEach((elem) => {
        let gold = new Object();
        gold.problemId = elem.problemId;
        gold.title = elem.titleKo;
        gold.level = elem.level;
        gold.tags = [];
        elem.tags.forEach((tag) => {
          gold.tags.push(tag.key);
        });
        gArray.push(gold);
      });
    }
  });
  await Promise.all(promises);
  return gArray;
};

const getPlatinum = async () => {
  let pArray = [];
  const promises = platinumOptions.map(async (platinumOption) => {
    const result = await axios.request(platinumOption);
    if (result.status == 200) {
      const platinumObjList = result.data.items;

      platinumObjList.forEach((elem) => {
        let platinum = new Object();
        platinum.problemId = elem.problemId;
        platinum.title = elem.titleKo;
        platinum.level = elem.level;
        platinum.tags = [];
        elem.tags.forEach((tag) => {
          platinum.tags.push(tag.key);
        });
        pArray.push(platinum);
      });
    }
  });
  await Promise.all(promises);
  return pArray;
};
*/

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

const findTagsFromAPI = async () => {
  try {
    const result = await axios.request(Options.tagOption);
    if (result.status !== 200) {
      console.log("❌ Status Code Not 200 for Tag axios request.");
      return [];
    }
    const { items } = result.data;
    let apiTags = [];
    if (checkContainsMajorTags(items) && items.length > 190) {
      items.forEach((item) => {
        let obj = new Object();
        obj.key = item.key;
        obj.koName = item.displayNames[0].name;
        obj.enName = item.displayNames[1].name;
        apiTags.push(obj);
      });
      console.log("⭐️ Got tags from solved.ac API");
      return apiTags;
    }
  } catch (err) {
    console.log(err);
    return [];
  }
};

const buildLevelTagList = async (userId) => {
  try {
    let tagList = [];
    tagList = await findTagsFromDB();
    const user = await User.findOne({ userId });
    //console.log(user);
    const dbTag = user.tags;
    const dbLevels = user.levels;
    if (tagList.length === 0) {
      tagList = await findTagsFromAPI();
    }
    if (tagList.length === 0) {
      console.log("❌ Cannot get Tags from DB nor API");
      return [];
    }

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
    let filtered = [];
    const levelSet = new Set(levelnums);
    const result = await Problem.find().in("level", levelnums);
    //console.log("filterDB_Problem:", result.length);
    for (const item of result) {
      if (levelSet.has(item.level) && item.isSolvable && !item.isPartial) {
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

const filterAPIProblem = async (levelnums, tagSet) => {
  try {
    let filtered = [];
    const levelSet = new Set(levelnums);
    const queryArray = buildQuery(levelnums);
    const promises = queryArray.map(async (queryObj) => {
      for (let i = 1; i <= queryObj.page; i++) {
        queryObj.query.params.page = String(i);
        const result = await axios.request(queryObj.query);
        if (result.status === 200) {
          const { items } = result.data;
          if (items.length === 0) break;

          for (const item of items) {
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
    });
    await Promise.all(promises);
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
      userProblems = await filterAPIProblem(levelnums, tagSet);
      if (userProblems.length > 0) {
        console.log("⭐️ Got Problems from API:", userProblems.length);
      }
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

    const filter = { userId: req.user };
    const update = { problemSet: userProblems, tags: tags, levels: levelnums };

    await User.findOneAndUpdate(filter, update);

    const dbUser = await User.findOne(filter);
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

/*
query for sovled.ac API: *s5..p1&lang:ko&s#100..&solvable:true
*/
