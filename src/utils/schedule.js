import User from "../models/User";
import Problem from "../models/Problem";
import Tag from "../models/Tag";
import axios from "axios";
import { getThreeRandom, getUserSolvedProblems } from "./util";
import { Options } from "./options";
import { getAllProblems, getAllTags } from "./util";
import { rules } from "eslint-config-prettier";

const schedule = require("node-schedule");
const fs = require("fs");

const updateSolvedProblems = async () => {
  try {
    const allUser = await User.find({});

    for (const user of allUser) {
      if (user === undefined) continue;
      const options = Options.baseSearchProblemOption;
      options.params.query = `solved_by:${user.userId}`;
      const result = await axios.request(options); // just bring the number of problems

      if (result.status != 200) {
        console.log(`❌ Failed to get User:${user.userId}`);
        continue;
      }

      if (user.totalSolved.length >= Number(result.data.count)) {
        console.log(
          `⭐️ ${user.userId}: Solved Problems already up to date: ${user.totalSolved.length}`
        );
        continue;
      }
      const solvedProblems = await getUserSolvedProblems(user.userId); // bring the set of problems solved by the user

      if (user.totalSolved.length < solvedProblems.length) {
        const filter = { userId: user.userId };
        const update = { totalSolved: solvedProblems };
        await User.findOneAndUpdate(filter, update);
        console.log(
          `✅ ${user.userId} 업데이트 완료: (문제수: ${solvedProblems.length})`
        );
      }
    }
  } catch (err) {
    console.log(err);
    return;
  }
};

const updateDailyProblems = async () => {
  try {
    const allUser = await User.find({});

    for (const user of allUser) {
      if (user === undefined) continue;
      console.log(`${user.userId}`);
      let review = [];
      let daily = [];
      if (user.totalSolved.length > 1) {
        review = getThreeRandom(user.totalSolved);
        //console.log("review", review);
        //await Uswer.findOneAndUpdate({userId: user.userId},{})
      }
      if (user.totalSolved.length > 1 && user.problemSet.length > 1) {
        const first = new Set(user.problemSet);
        const second = new Set(user.totalSolved);
        const candidate = [...first].filter((elem) => !second.has(elem));
        if (candidate.length === 1) continue;

        daily = getThreeRandom(candidate);
        console.log("today", daily);
      }
      await User.findOneAndUpdate(
        { userId: user.userId },
        { todaySolved: daily, review: review }
      );
    }
  } catch (err) {
    console.log(err);
    return;
  }
};

const dumpProblem = async () => {
  try {
    const problem = await getAllProblems();
    if (problem.length < 2900) return;
    console.log(problem.length);
    let fileData = [];
    if (fs.existsSync(process.cwd() + "/src/db/problem.json")) {
      fileData = fs.readFileSync(process.cwd() + "/src/db/problem.json", {
        encoding: "utf-8",
        flag: "r",
      });
    }
    let fileProblem = {};
    fileProblem.counts = 0;
    if (fileData.length > 0) fileProblem = JSON.parse(fileData);
    console.log("dump problem length:", problem.length);
    if (problem.length > fileProblem.counts && fileProblem.counts < 2900) {
      const dump = new Object();
      dump.counts = problem.length;
      dump.lastUpdate = new Date();
      dump.problems = problem;
      fs.writeFileSync(
        process.cwd() + "/src/db/problem.json",
        JSON.stringify(dump)
      );
      console.log("⭐️ Set FS Problems:", dump.problems.length);
    } else {
      console.log("✅ fs problems already upto date:", fileProblem.counts);
    }

    const dbProblemCnt = await Problem.find().count();
    if (problem.length > dbProblemCnt) {
      for (const item of problem) {
        const problemExists = await Problem.exists({
          problemId: item.problemId,
        });
        if (!problemExists) {
          await Problem.create({
            problemId: item.problemId,
            title: item.title,
            level: item.level,
            tags: item.tags,
          });
        }
      }
      console.log("⭐️ Set DB Problems");
    } else {
      console.log("✅ MongoDB: Problem Collections already set.");
    }
  } catch (err) {
    console.log(err);
  }
};

const dumpTags = async () => {
  try {
    const tags = await getAllTags();
    if (tags.length < 190) return;
    let fileData = [];
    if (fs.existsSync(process.cwd() + "/src/db/tag.json")) {
      fileData = fs.readFileSync(process.cwd() + "/src/db/tag.json", {
        encoding: "utf-8",
        flag: "r",
      });
    }
    let fileTag = {};
    fileTag.counts = 0;
    if (fileData.length > 0) fileTag = JSON.parse(fileData);
    //console.log(fileTag.counts, tags.length);
    if (tags.length > fileTag.counts && fileTag.counts < 190) {
      console.log("It's different");
      const dump = new Object();
      dump.counts = tags.length;
      dump.lastUpdate = new Date();
      dump.tags = tags;
      fs.writeFileSync(
        process.cwd() + "/src/db/tag.json",
        JSON.stringify(dump)
      );
      console.log("⭐️ Set FS Tags:", dump.tags.length);
    } else {
      console.log("✅ fs tags already upto date:", fileTag.counts);
    }

    const dbTagCnt = await Tag.find().count();

    if (tags.length > dbTagCnt) {
      for (const item of tags) {
        const tagExist = await Tag.exists({ key: item.key });
        if (!tagExist) {
          await Tag.create({
            key: item.key,
            koName: item.koName,
            enName: item.enName,
          });
        }
      }
      console.log("⭐️ Set DB Tags");
    } else {
      console.log("✅ MongoDB: Tag Collections already set.");
    }
  } catch (err) {
    console.log(err);
  }
};

const TIME_ZONE = "Asia/Seoul";
const solvedProblemRule = new schedule.RecurrenceRule();
solvedProblemRule.dayOfWeek = [0, new schedule.Range(0, 6)];
solvedProblemRule.hour = 5;
solvedProblemRule.minute = 0;
solvedProblemRule.tz = TIME_ZONE;

const dailyRule = new schedule.RecurrenceRule();
dailyRule.dayOfWeek = [0, new schedule.Range(0, 6)];
dailyRule.hour = 6;
dailyRule.minute = 0;
dailyRule.tz = TIME_ZONE;

const dumpProblemRule = new schedule.RecurrenceRule();
dumpProblemRule.minute = 3;
dumpProblemRule.tz = TIME_ZONE;

const dumpTagRule = new schedule.RecurrenceRule();
dumpTagRule.minute = 1;
dumpTagRule.tz = TIME_ZONE;

export const job1 = schedule.scheduleJob(
  solvedProblemRule,
  updateSolvedProblems
);
export const job2 = schedule.scheduleJob(dailyRule, updateDailyProblems);
export const job3 = schedule.scheduleJob(dumpProblemRule, dumpProblem);
export const job4 = schedule.scheduleJob(dumpTagRule, dumpTags);
export const job5 = schedule.scheduleJob(`0 20 * * *`, () =>
  console.log("⭐️ It's 8!!!")
);
//export const job2 = schedule.scheduleJob(`*/5 * * * * *`, () => {
//  console.log("5초마다 실행");
//});
