import express from "express";
import axios from "axios";
import {
  taglistOptions,
  silverOptions,
  goldOptions,
  platinumOptions,
  majorTags,
  levels,
} from "./options";

const problemRouter = express.Router();

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

const getProblemSettings = async (req, res) => {
  let setlist = [];
  const taglist = await getTags();
  //const slist = await getSilver();
  //const glist = await getGold();
  //const plist = await getPlatinum();

  //return res.send(JSON.stringify(tlist));
  //return res.send(JSON.stringify(taglist));

  //console.log(plist);

  taglist.forEach((tag) => {
    if (majorTags.includes(tag.enName)) tag.major = true;
    else tag.major = false;
  });

  setlist.push(levels);
  setlist.push(taglist);
  //console.log(taglist);

  return res.render("problem", { setlist });
};

const postProblemSettings = async (req, res) => {
  const settings = Object.values(req.body);
  let levelnums = [];
  let tags = [];

  let tmp = [];
  for (let i = 6; i <= 20; i++) tmp.push(String(i));
  const numCheck = new Set(tmp);

  settings.forEach((elem) => {
    if (numCheck.has(elem)) levelnums.push(Number(elem));
    else tags.push(elem);
  });

  const tagSet = new Set(tags);
  const levelSet = new Set(levelnums);

  console.log("tagSet", tagSet);
  console.log("levelSet", levelSet);

  let filtered = [];
  const goldList = await getGold();

  goldList.forEach((elem) => {
    const { tags, level } = elem;
    if (levelSet.has(level)) {
      let cnt = 0;
      for (let tag of tags) {
        if (tagSet.has(tag)) cnt++;
      }
      if (cnt === tags.length) {
        filtered.push(elem);
      }
    }
  });

  //console.log(goldList.length);
  //console.log(filtered.length);

  //console.info(new Blob([JSON.stringify(filtered)]).size);
  return res.send(JSON.stringify(filtered));
};

problemRouter.route("/").get(getProblemSettings).post(postProblemSettings);

export default problemRouter;
