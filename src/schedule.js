import User from "./models/User";
import Problem from "./models/Problem";
import axios from "axios";
import { getThreeRandom, getUserSolvedProblems } from "./utils/util";
import { Options } from "./utils/options";
import { getAllProblems } from "./utils/util";

const schedule = require("node-schedule");
const fs = require("fs");

const updateSolvedProblems = async () => {
  try {
    const allUser = await User.find({});

    for (const user of allUser) {
      const options = Options.baseSearchProblemOption;
      options.params.query = `solved_by:${user.userId}`;
      const result = await axios.request(options);

      if (result.status != 200) return;

      if (user.totalSolved.length === Number(result.data.count)) {
        console.log(
          `⭐️ ${user.userId}: Solved Problems already up to date: ${user.totalSolved.length}`
        );
        continue;
      }
      const solvedProblems = await getUserSolvedProblems(user.userId);

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
      if (user.problemSet.length > 1) {
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

export const dumpProblem = async () => {
  try {
    const problem = await getAllProblems();
    const fileData = fs.readFileSync(
      process.cwd() + "/problemBackup/problem.json",
      { encoding: "utf-8", flag: "r" }
    );
    const fileProblem = JSON.parse(fileData);

    if (problem.length > fileProblem.counts) {
      const dump = new Object();
      dump.counts = problem.length;
      dump.lastUpdate = new Date();
      dump.problems = problem;
      fs.writeFileSync(
        process.cwd() + "/problemBackup/problem.json",
        JSON.stringify(dump)
      );
      console.log("⭐️ Set FS Problems");
    } else {
      console.log("✅ fs problems already up to date:", fileProblem.counts);
    }

    const dbProblemCnt = await Problem.find().count();
    if (problem.length > dbProblemCnt) {
      await Problem.deleteMany({});
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

export const job1 = schedule.scheduleJob(`18 * * * *`, updateSolvedProblems);
export const job2 = schedule.scheduleJob(`19 * * * *`, dumpProblem);

//export const job2 = schedule.scheduleJob(`*/5 * * * * *`, () => {
//  console.log("5초마다 실행");
//});
