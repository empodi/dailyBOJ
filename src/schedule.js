import User from "./models/User";
import axios from "axios";
const schedule = require("node-schedule");

//const j = schedule.scheduleJob(`*/5 * * * * *`, function () {
//  console.log("매 5초마다 실행");
//});
//app.set(j);

const options = {
  method: "GET",
  url: "https://solved.ac/api/v3/search/problem",
  params: { query: "solved_by:empodi" },
  headers: { "Content-Type": "application/json" },
};

const updateSolvedProblems = async () => {
  try {
    const allUser = await User.find({});

    for (const user of allUser) {
      options.params.query = `solved_by:${user.userId}`;
      const result = await axios.request(options);

      if (result.status != 200) return;

      if (user.totalSolved.length === Number(result.data.count)) {
        console.log(
          `⭐️ ${user.userId}: Solved Problems already up to date: ${user.totalSolved.length}`
        );
        continue;
      }
      let solvedProblems = [];
      const maxPage = 300;

      for (let i = 1; i <= maxPage; i++) {
        options.params.page = i;
        const result = await axios.request(options);
        if (result.status != 200) return;
        const { items } = result.data;
        if (items.length === 0) break;
        for (let item of items) {
          solvedProblems.push(Number(item.problemId));
        }
      }
      const { items } = result.data;

      items.map((item) => solvedProblems.push(item.problemId));

      const filter = { userId: user.userId };
      const update = { totalSolved: solvedProblems };
      await User.findOneAndUpdate(filter, update);
      console.log(
        `✅ ${user.userId} 업데이트 완료: (문제수: ${solvedProblems.length})`
      );
    }
  } catch (err) {
    console.log(err);
    return;
  }
};

const getThreeRandom = (candidate) => {
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
        console.log("review", review);
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

export const job = schedule.scheduleJob(`52 * * * *`, updateDailyProblems);

//export const job2 = schedule.scheduleJob(`*/5 * * * * *`, () => {
//  console.log("5초마다 실행");
//});
