const Web3 = require("web3");
const TESTNET_NODE_URL =
  "https://speedy-nodes-nyc.moralis.io/418f8e6973f3c5924015ef94/avalanche/testnet";
const LOCALNET_NODE_URL = "http://127.0.0.1:9650/ext/bc/C/rpc";
const testnetProvider = new Web3.providers.HttpProvider(TESTNET_NODE_URL);
const localnetProvider = new Web3.providers.HttpProvider(LOCALNET_NODE_URL);

module.exports = {
  getNetworkAndWeb3: (req, res, next) => {
    const network = req.cookies["network"];
    // console.log(network);

    if (!network) {
      req.network = "testnet";
      const testnetWeb3 = new Web3(testnetProvider);
      // console.log(testnetWeb3);
      req.web3 = testnetWeb3;
      next();
    } else {
      // console.log("--- Called getNetwork ---");
      // console.log(req.cookies);
      if (network === "localnet") {
        req.network = network;
        const localnetWeb3 = new Web3(localnetProvider);
        // console.log(localnetWeb3);
        req.web3 = localnetWeb3;
        next();
      } else if (network === "testnet") {
        req.network = "testnet";
        const testnetWeb3 = new Web3(testnetProvider);
        // console.log(testnetWeb3);
        req.web3 = testnetWeb3;
        next();
      }
    }
  },
  getWeb3: (req, res, next) => {
    const network = req.cookies["network"];
    // console.log("--- Called getWeb3 Middleware ---");
    // console.log(network);

    if (!network) {
      req.network = "testnet";
      const testnetWeb3 = new Web3(testnetProvider);
      // console.log(testnetWeb3);
      req.web3 = testnetWeb3;
      next();
    } else {
      // console.log("--- Called getNetwork ---");
      // console.log(req.cookies);
      if (network === "localnet") {
        req.network = network;
        const localnetWeb3 = new Web3(localnetProvider);
        // console.log(localnetWeb3);
        req.web3 = localnetWeb3;
        next();
      } else if (network === "testnet") {
        req.network = "testnet";
        const testnetWeb3 = new Web3(testnetProvider);
        // console.log(testnetWeb3);
        req.web3 = testnetWeb3;
        next();
      }
    }
  },
};
