const Web3 = require("web3");
const NODE_URL =
  "https://speedy-nodes-nyc.moralis.io/418f8e6973f3c5924015ef94/avalanche/testnet";
const provider = new Web3.providers.HttpProvider(NODE_URL);
const web3 = new Web3(provider);
const { Tx } = require("../models");

const getCurrentBlockNumber = async () => await web3.eth.getBlockNumber();

const getTx = async (tx) => await web3.eth.getTransaction(tx);

const getTxIDs = async (startBlkNum, currentBlockNumber) => {
  try {
    //조회하고자 하는 블록들 조회하여 모든 트랜잭션 ID 추출
    let txIDs = [];
    for (let j = startBlkNum; j < currentBlockNumber + 1; j++) {
      let block = await web3.eth.getBlock(j);
      // console.log(`${currentBlockNumber} - ${block.number}`);
      txIDs = txIDs.concat(block.transactions);
    }
    return txIDs;
  } catch (e) {
    console.log(e.message);
  }
};

const getTxs = async (txIDs) => {
  const allTransactions = [];

  for (let tx of txIDs) {
    allTransactions.push(await getTx(tx));
  }

  return allTransactions;
};

const getNewTxs = async (startBlkNum, currentBlockNumber) => {
  try {
    //조회하고자 하는 블록들 조회하여 모든 트랜잭션 ID 추출
    const allTransactions = [];

    for (let j = startBlkNum; j < currentBlockNumber + 1; j++) {
      let block = await web3.eth.getBlock(j);
      // console.log(`${currentBlockNumber} - ${block.number}`);
      for (let tx of block.transactions) {
        allTransactions.push(getTx(tx));
      }
    }

    return Promise.all(allTransactions);
    // .then((data) => {
    //   const result = [];
    //   for (let tx of data) {
    //     if (tx.value === "0") continue;
    //     result.push(tx);
    //   }
    //   return result;
    // });
  } catch (e) {
    console.log(e.message);
  }
};

const storeTx = async (tx) => {
  // console.log(tx.hash, tx.blockNumber);
  await Tx.findOrCreate({
    where: { tx_hash: tx.hash },
    defaults: {
      network: "testnet",
      tx_hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: web3.utils.fromWei(tx.value, "ether"),
      block: tx.blockNumber,
    },
  });

  // const balance = await web3.eth.getBalance(tx.to);
  // await User.update(
  //   {
  //     balance: web3.utils.fromWei(balance, "ether"),
  //   },
  //   { where: { address: tx.to } }
  // );
};

module.exports = {
  getCurrentBlockNumber,
  getTxIDs,
  getTxs,
  storeTx,
  getNewTxs,
};
