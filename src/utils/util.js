import axios from "axios";
import { levels, majorTags, Options } from "./options";

export const MAX_PAGE = 500;
export const MAX_LEVEL = 20; // Platinum 1
export const MIN_LEVEL = 6; // Silver 5
export const USER_COUNT = 100;

export const isArrayEqual = (a, b) =>
  a.length === b.length && a.every((v, i) => String(v) === String(b[i]));

export const onlyNumbers = (str) => {
  return /^[0-9]+$/.test(str);
};

export const isValidLevel = (str) => {
  const level = Number(str);
  if (level >= MIN_LEVEL && level <= MAX_LEVEL) return true;
  else return false;
};

export const findTier = (n) => {
  for (let level of levels) {
    if (level.num === n) {
      return level.tier.charAt(0) + level.tier.charAt(level.tier.length - 1);
    }
  }
  return "";
};

export const groupArray = (nums) => {
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

export const buildParams = (nums) => {
  let paramsList = [];
  const ranges = groupArray(nums);
  //console.log(ranges);
  for (const range of ranges) {
    if (
      range.length === 2 &&
      isValidLevel(range[0]) &&
      isValidLevel(range[1])
    ) {
      const obj = new Object();
      const apiQuery = `*${findTier(range[0])}..${findTier(
        range[1]
      )}&lang:ko&s#${USER_COUNT}..`;
      obj.page = (range[1] - range[0] + 1) * 3;
      obj.query = apiQuery;
      paramsList.push(obj);
    }
  }
  return paramsList;
};

/**이제 정상 출력 */
export const buildQuery = (nums) => {
  let queryList = [];
  const ranges = groupArray(nums);
  for (let range of ranges) {
    if (
      range.length === 2 &&
      isValidLevel(range[0]) &&
      isValidLevel(range[1])
    ) {
      const obj = new Object();
      obj.method = Options.baseSearchProblemOption.method;
      obj.url = Options.baseSearchProblemOption.url;
      obj.params = new Object();
      obj.headers = Options.baseSearchProblemOption.headers;
      const newQuery = `*${findTier(range[0])}..${findTier(
        range[1]
      )}&lang:ko&s#200..`;
      obj.params.page = (range[1] - range[0] + 1) * 3;
      obj.params.query = newQuery;
      queryList.push(obj);
    }
  }
  console.log("😀 console buildQuery start");
  for (const q of queryList) {
    console.log(q);
  }
  console.log("😀 console buildQuery end");
  return queryList;
};

export const checkContainsMajorTags = (tagList) => {
  let tagKeySet = new Set();
  tagList.forEach((tag) => {
    tagKeySet.add(tag.key);
  });
  if (majorTags.every((majorTag) => tagKeySet.has(majorTag))) return true;
  else return false;
};

export const getThreeRandom = (candidate) => {
  if (candidate.length < 3) return [];
  const min = 0;
  const max = candidate.length - 1;

  let indices = [];
  const indexLen = Math.min(3, candidate.length);

  while (indices.length < indexLen) {
    const x = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!indices.includes(x)) indices.push(x);
  }
  indices.sort((a, b) => a - b);

  const ret = [];
  ret.push(candidate[indices[0]]);
  ret.push(candidate[indices[1]]);
  ret.push(candidate[indices[2]]);
  return ret;
};

export const getUserSolvedProblems = async (userId) => {
  let totalSolved = [];
  const baseOption = Options.baseSearchProblemOption;
  baseOption.params.query = `solved_by:${userId}`;
  try {
    for (let i = 1; i <= MAX_PAGE; i++) {
      baseOption.params.page = i;
      const result = await axios.request(baseOption);
      if (result.status == 200) {
        const { items } = result.data;
        if (items.length === 0) break;
        for (let item of items) {
          totalSolved.push(Number(item.problemId));
        }
      }
    }
    return totalSolved;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const getAllProblems = async () => {
  try {
    const problem = [];

    const option = Options.totalProblemOption;
    option.params.query += `&s#${USER_COUNT}..`;

    for (let i = 1; i <= MAX_PAGE; i++) {
      option.params.page = String(i);
      //console.log(option.params);
      const result = await axios.request(option);
      if (result.status === 200) {
        const { items } = result.data;
        if (items.length === 0) break;
        for (let item of items) {
          if (item.isSolvable && !item.isPartial) {
            const obj = new Object();
            let tags = [];
            for (let t of item.tags) tags.push(t.key);
            obj.problemId = item.problemId;
            obj.title = item.titleKo;
            obj.level = item.level;
            obj.tags = tags;
            problem.push(obj);
          }
        }
      } else {
        console.log("Problem Fetch Error");
      }
    }
    return problem;
  } catch (err) {
    console.log(err);
    return [];
  }
};

export const getAllTags = async () => {
  try {
    const result = await axios.request(Options.tagOption);
    if (result.status !== 200) {
      console.log("❌ Status Code Not 200 for Tag axios request.");
      return [];
    }
    const { items } = result.data;
    let apiTags = [];
    if (checkContainsMajorTags(items) && items.length > 190) {
      items.map((item) => {
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

/**
 * 
 * 이것도 중복 출력....
export const buildQuery = (nums) => {
  let queryList = [];
  const ranges = groupArray(nums);
  for (let range of ranges) {
    if (
      range.length === 2 &&
      isValidLevel(range[0]) &&
      isValidLevel(range[1])
    ) {
      const obj = Options.baseSearchProblemOption;
      const newQuery = `*${findTier(range[0])}..${findTier(
        range[1]
      )}&lang:ko&s#200..`;
      obj.params.page = (range[1] - range[0] + 1) * 3;
      obj.params.query = newQuery;
      queryList.push(obj);
    }
  }
  console.log("😀 console buildQuery start");
  for (const q of queryList) {
    console.log(q);
  }
  console.log("😀 console buildQuery end");
  return queryList;
};
 * 
 * 
 */
