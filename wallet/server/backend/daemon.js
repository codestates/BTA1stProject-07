const cron = require("node-cron");
const { getCurrentBlockNumber, storeTx, getNewTxs } = require("./utils/daemon");
const fs = require("fs");
const path = require("path");
const basePath = __dirname;
const db = require("./models");

// 시작 시 DB 테이블(Txes, Users) 지운 다음, 다시 생성
const init = async () => {
  await db.Tx.sync({ force: true });
};
init();

let taskRunning = false;
let FIRST = true;

const task = cron.schedule(
  "*/5 * * * * *", // 30초에 한번씩 실행
  async () => {
    try {
      if (taskRunning) {
        // console.log("returning");
        return;
      }

      taskRunning = true;

      let startBlockNumber =
        Number(
          fs.readFileSync(path.join(basePath, "./utils/blockNumber"), {
            encoding: "utf-8",
          })
        ) + 1;

      let currentBlockNumber = await getCurrentBlockNumber();

      // TODO: (삭제 예정) 시작 블록 넘버가 현재 블록 넘버보다 3 이상 크면
      //       현재 블록 넘버 - 3 부터 시작

      if (FIRST) {
        startBlockNumber = currentBlockNumber - 3;
        FIRST = false;
      }

      console.log(startBlockNumber, currentBlockNumber);
      if (startBlockNumber > currentBlockNumber) {
        taskRunning = false;
        return;
      }

      // const txIDs = await getTxIDs(startBlockNumber, currentBlockNumber);
      // const txs = await getTxs(txIDs);

      const txs = await getNewTxs(startBlockNumber, currentBlockNumber);

      const works = [];

      for (let tx of txs) {
        works.push(storeTx(tx));
      }

      if (works.length > 0) {
        Promise.all(works).then(() => {
          if (currentBlockNumber >= startBlockNumber) {
            console.log(
              `==== 블록 모니터링 완료 : ${startBlockNumber} ~ ${currentBlockNumber} ====`
            );
            fs.writeFileSync(
              path.join(basePath, "./utils/blockNumber"),
              String(currentBlockNumber)
            );
            taskRunning = false;
            // sequelize.close();
          }
        });
      }
    } catch (e) {
      console.log(e.message);
    }
  },
  {
    scheduled: false,
  }
);

task.start();
