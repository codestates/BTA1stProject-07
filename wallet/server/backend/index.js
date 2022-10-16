const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
// const account = require("./routes/account");
require("dotenv").config();
const transaction = require("./routes/transaction.js");
const user = require("./routes/user.js");
// const Web3 = require("web3");
const PORT = 4000;
// const BLOCKCHAIN_NETWORK = "http://localhost:8545";

// const web3 = new Web3(new Web3.providers.HttpProvider(BLOCKCHAIN_NETWORK));
// global.web3 = web3;

// const Web3 = require("web3");
// const NODE_URL =
//   "https://speedy-nodes-nyc.moralis.io/418f8e6973f3c5924015ef94/avalanche/testnet";
// const provider = new Web3.providers.HttpProvider(NODE_URL);
// const web3 = new Web3(provider);
// global.web3 = web3;

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// web3.eth.getAccounts().then((accounts) => {
//   console.log(accounts);
//   global.ganacheAccounts = accounts;
// });

// app.use("/account", account);
app.use("/transaction", transaction);
app.use("/user", user);

app.listen(PORT, () => {
  console.log(
    `당신의 서버 ${PORT}에서 도는중... 많은 응원과 격려 부탁드립니다`
  );
});
