import User from "./models/User";
import axios from "axios";
import { getThreeRandom, getUserSolvedProblems } from "./utils/util";
import { Options } from "./utils/options";
const schedule = require("node-schedule");

//const j = schedule.scheduleJob(`*/5 * * * * *`, function () {
//  console.log("매 5초마다 실행");
//});
//app.set(j);
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

export const job = schedule.scheduleJob(`36 * * * *`, updateSolvedProblems);

//export const job2 = schedule.scheduleJob(`*/5 * * * * *`, () => {
//  console.log("5초마다 실행");
//});
