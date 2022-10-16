const router = require("express").Router();
const { getNetworkAndWeb3 } = require("../controllers/middlewares.js");
const {
  getTransactions,
  getMyFromTransactions,
  getLatestReceivers,
} = require("../controllers/transaction.js");
const { verifyToken } = require("../controllers/user.js");

router.get("/", getNetworkAndWeb3, getTransactions);
router.get(
  "/latest-receivers",
  verifyToken,
  getNetworkAndWeb3,
  getLatestReceivers
);
// router.post("/network", setNetwork);

module.exports = router;
