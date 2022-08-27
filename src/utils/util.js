import axios from "axios";
import { levels, majorTags, Options } from "./options";

export const MAX_PAGE = 300;
export const MAX_LEVEL = 20; // Platinum 1
export const MIN_LEVEL = 6; // Silver 5

export const onlyNumbers = (str) => {
  return /^[0-9]+$/.test(str);
};

export const isValidLevel = (str) => {
  const level = Number(str);
  if (level >= MIN_LEVEL && MAX_LEVEL <= 20) return true;
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

export const buildQuery = (nums) => {
  let queryList = [];
  const ranges = groupArray(nums);

  for (let range of ranges) {
    const obj = new Object();
    const newQuery = Options.baseSearchProblemOption;
    if (
      range.length === 2 &&
      isValidLevel(range[0]) &&
      isValidLevel(range[1])
    ) {
      newQuery.params.query = `*${findTier(range[0])}..${findTier(
        range[1]
      )}&lang:ko&s#200..`;
      obj.page = (range[1] - range[0] + 1) * 3;
      obj.query = newQuery;
      queryList.push(obj);
    }
  }
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
