import axios from "axios";
import Problem from "../models/Problem";
import Tag from "../models/Tag";
import {
  taglistOptions,
  silverOptions,
  goldOptions,
  platinumOptions,
  levels,
  majorTags,
} from "./options";

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

const onlyNumbers = (str) => {
  return /^[0-9]+$/.test(str);
};

const isValidLevel = (str) => {
  const level = Number(str);
  if (level >= 6 && level <= 20) return true;
  else return false;
};

const findTier = (n) => {
  for (let level of levels) {
    if (level.num === n) {
      return level.tier.charAt(0) + level.tier.charAt(level.tier.length - 1);
    }
  }
  return "";
};

const groupArray = (nums) => {
  let prev = 0;
  let cur = 1;
  let ret = []; // build a 2d array
  while (cur <= nums.length) {
    if (nums[cur - 1] + 1 !== nums[cur] || cur === nums.length) {
      let r = [];
      r.push(nums[prev]);
      r.push(nums[cur - 1]);
      ret.push(r);
      prev = cur;
    }
    cur++;
  }
  return ret;
};

const buildQuery = (nums) => {
  let queryList = [];
  const ranges = groupArray(nums);

  for (let range of ranges) {
    let obj = new Object();
    let qq = new Object();
    qq.method = "GET";
    qq.url = "https://solved.ac/api/v3/search/problem";
    qq.headers = { "Content-Type": "application/json" };
    qq.params = new Object();
    if (
      range.length === 2 &&
      isValidLevel(range[0]) &&
      isValidLevel(range[1])
    ) {
      qq.params.query = `*${findTier(range[0])}..${findTier(
        range[1]
      )}&lang:ko&s#200..`;
      obj.page = (range[1] - range[0] + 1) * 3;
      obj.query = qq;
      queryList.push(obj);
    }
  }
  return queryList;
};

const checkContainsMajorTags = (tagList) => {
  let tagKeySet = new Set();
  tagList.forEach((tag) => {
    tagKeySet.add(tag.key);
  });
  if (majorTags.every((majorTag) => tagKeySet.has(majorTag))) return true;
  else return false;
};

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
    const result = await axios.request(taglistOptions);
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

const buildLevelTagList = async () => {
  let tagList = [];
  try {
    tagList = await findTagsFromDB();
    if (tagList.length === 0) {
      tagList = await findTagsFromAPI();
    }
    if (tagList.length === 0) {
      console.log("❌ Cannot get Tags from DB nor solved.ac API");
      return [];
    } else {
      tagList.forEach((tag) => {
        if (majorTags.includes(tag.enName) || majorTags.includes(tag.key))
          tag.isMajor = true;
        else tag.isMajor = false;
      });
      const levelTagList = [];
      levelTagList.push(levels);
      levelTagList.push(tagList);
      return levelTagList;
    }
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const getProblemSettings = async (req, res) => {
  const levelTagList = await buildLevelTagList();

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
  const levelSet = new Set(levelnums);
  const queryArray = buildQuery(levelnums);
  let filtered = [];

  const promises = queryArray.map(async (queryObj) => {
    for (let i = 1; i <= queryObj.page; i++) {
      queryObj.query.params.page = String(i);
      const result = await axios.request(queryObj.query);
      if (result.status === 200) {
        const { items } = result.data;
        if (items.length === 0) break;

        for (const item of items) {
          if (levelSet.has(item.level) && item.isSolvable && !item.isPartial) {
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
};

export const postProblemSettings = async (req, res) => {
  const settings = Object.values(req.body);
  let levelnums = [];
  let tagSet = new Set();

  settings.forEach((elem) => {
    if (onlyNumbers(elem)) levelnums.push(Number(elem));
    else tagSet.add(elem);
  });
  levelnums.sort((a, b) => a - b);

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
      return res.status(400).redirect("home");
    }
    if (userProblems.length < 100) {
      // alert the number of problems is too small
      console.log("❗️ Number of problems less than 100!!");
    }

    //console.info(new Blob([JSON.stringify(filtered)]).size);
    return res.send(JSON.stringify(userProblems));
  } catch (err) {
    console.log(err);
    const levelTagList = await buildLevelTagList();
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
