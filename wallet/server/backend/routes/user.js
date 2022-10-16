const router = require("express").Router();
const { getNetworkAndWeb3 } = require("../controllers/middlewares.js");
const {
  createUser,
  getUser,
  verifyToken,
  transfer,
  login,
  restore,
} = require("../controllers/user.js");

router.post("/", getNetworkAndWeb3, createUser);
router.get("/", verifyToken, getNetworkAndWeb3, getUser);
router.post("/transfer", verifyToken, getNetworkAndWeb3, transfer);
router.post("/login", getNetworkAndWeb3, login);
router.post("/restore", getNetworkAndWeb3, restore);

module.exports = router;
