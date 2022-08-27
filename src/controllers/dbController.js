import axios from "axios";
import Problem from "../models/Problem";
import User from "../models/User";
import Tag from "../models/Tag";

const problemOption = {
  method: "GET",
  url: "https://solved.ac/api/v3/search/problem",
  params: { query: "*s5..p1&lang:ko&s#100..&solvable:true" },
  headers: { "Content-Type": "application/json" },
};

const tagOption = {
  method: "GET",
  url: "https://solved.ac/api/v3/tag/list",
  headers: { "Content-Type": "application/json" },
};

export const setDBProblem = async (req, res) => {
  //const userCount = await User.find().count();
  //console.log("User Count", userCount);
  try {
    const problemCount = await Problem.find().count();
    console.log("Problem Count", problemCount);
    if (problemCount > 2800) {
      console.log("✅ MongoDB: Problem Collections already set.");
      return res.status(200).redirect("/");
    } else {
      await Problem.deleteMany({});
      const pbLen = await Problem.find().count();
      console.log("Deleted Problem Documents:", pbLen);
      for (let i = 1; i <= 500; i++) {
        problemOption.params.page = String(i);
        const result = await axios.request(problemOption);
        if (result.status === 200) {
          const { items } = result.data;
          if (items.length === 0) break;
          for (let item of items) {
            if (item.isSolvable === false || item.isPartial === true) continue;
            let tags = [];
            for (let t of item.tags) tags.push(t.key);
            await Problem.create({
              problemId: item.problemId,
              title: item.titleKo,
              level: item.level,
              isSolvable: item.isSolvable,
              isPartial: item.isPartial,
              tags,
            });
          }
        } else {
          console.log("Problem Fetch Error");
          return res.status(400).render("home");
        }
      }
      return res.status(200).render("home");
    }
  } catch (err) {
    console.log(err);
    return res.status(400).render("home");
  }

  /*
  try {
    console.log("Set User problems");
  } catch (err) {
    console.log(err);
    return res.status(400).redirect("/");
  }
  */
};

export const setDBTag = async (req, res) => {
  try {
    await Tag.deleteMany({});
    const tagLen = await Tag.find().count();
    console.log("Deleted Tag Documents:", tagLen);
    let tlist = [];
    const tcnt = await Tag.find().count();
    const result = await axios.request(tagOption);
    const { count, items } = result.data;
    if (tcnt === count) {
      console.log("✅ MongoDB: Tag Collections already set.");
      return res.status(200).render("home");
    }
    for (const item of items) {
      /*
      let obj = new Object();
      obj.key = item.key;
      obj.koName = item.displayNames[0].name;
      obj.enName = item.displayNames[1].name;
      tlist.push(obj);
      */
      await Tag.create({
        key: item.key,
        koName: item.displayNames[0].name,
        enName: item.displayNames[1].name,
      });
    }
    const tagCount = await Tag.find().count();
    console.log("⭐️ tagCount:", tagCount);
    return res.status(200).render("home");
  } catch (err) {
    console.log(err);
    return res.status(400).render("home");
  }
};
