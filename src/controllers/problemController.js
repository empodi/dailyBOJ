import axios from "axios";
import {
  taglistOptions,
  silverOptions,
  goldOptions,
  platinumOptions,
  majorTags,
  levels,
} from "./options";

const getTags = async () => {
  let tagArray = [];
  const result = await axios.request(taglistOptions);
  if (result.status == 200) {
    const tagObjList = result.data.items;
    tagObjList.forEach((elem) => {
      let tagData = new Object();
      tagData.enName = elem.key;
      tagData.koName = elem.displayNames[0].name;
      tagArray.push(tagData);
    });
  }
  //console.log(tagArray.length);
  return tagArray;
};

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

export const getProblemSettings = async (req, res) => {
  let setlist = [];
  const taglist = await getTags();

  taglist.forEach((tag) => {
    if (majorTags.includes(tag.enName)) tag.major = true;
    else tag.major = false;
  });

  setlist.push(levels);
  setlist.push(taglist);
  //console.log(taglist);
  return res.render("problem", { setlist });
};

const onlyNumbers = (str) => {
  return /^[0-9]+$/.test(str);
};

const findTier = (n) => {
  let ret;
  for (let level of levels) {
    if (level.num === n) ret = level.tier;
  }
  return ret.charAt(0) + ret.charAt(ret.length - 1);
};

const groupArray = (nums) => {
  let prev = 0;
  let cur = 1;
  let ret = []; // build a 2d array
  while (cur <= nums.length) {
    if (nums[cur - 1] + 1 !== nums[cur] || cur === nums.length) {
      let r = [];
      if (cur - 1 === prev) r.push(nums[prev]);
      else {
        r.push(nums[prev]);
        r.push(nums[cur - 1]);
      }
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
    if (range.length === 1) {
      qq.params.query = `*${findTier(range[0])}&lang:ko&s#200..`;
      obj.page = 3;
    } else if (range.length === 2) {
      qq.params.query = `*${findTier(range[0])}..${findTier(
        range[1]
      )}&lang:ko&s#200..`;
      obj.page = (range[1] - range[0] + 1) * 3;
    }
    obj.query = qq;
    queryList.push(obj);
  }
  return queryList;
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
  const levelSet = new Set(levelnums);
  const queryArray = buildQuery(levelnums);

  //console.log("tagSet", tagSet);
  //console.log("levelSet", levelSet);

  let filtered = [];

  const promises = queryArray.map(async (queryObj) => {
    for (let i = 1; i <= queryObj.page; i++) {
      queryObj.query.params.page = String(i);
      const result = await axios.request(queryObj.query);
      if (result.status == 200) {
        const { items } = result.data;
        if (items.length === 0) break;
        for (let item of items) {
          if (levelSet.has(item.level) && item.isSolvable && !item.isPartial) {
            // 레벨은 더블 체킹, 채점 가능 여부 확인, 서브 태스크 및 부분 점수 문제는 제외
            let obj = new Object();
            obj.problemId = item.problemId;
            obj.title = item.titleKo;
            obj.level = item.level;
            obj.tags = [];
            let cnt = 0;
            for (let tag of item.tags) {
              if (tagSet.has(tag.key)) cnt++;
              obj.tags.push(tag.key);
            }
            if (cnt === item.tags.length) {
              filtered.push(obj);
            }
          }
        }
      } else {
        return res.sendStatus(400);
      }
    }
  });

  await Promise.all(promises);

  console.log(filtered.length);
  let plist = [];
  for (let p of filtered) {
    plist.push(p.problemId);
  }

  //console.info(new Blob([JSON.stringify(filtered)]).size);
  return res.send(JSON.stringify(plist));
};

/*
query for sovled.ac API: *s5..p1&lang:ko&s#100..&solvable:true
*/
