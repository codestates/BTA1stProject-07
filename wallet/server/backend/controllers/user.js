const { Op } = require("@sequelize/core");
const { User, Tx } = require("../models");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

const makeSalt = (length) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const getToken = (user) => {
  return jwt.sign({ address: user.address }, process.env.TOKEN_SECRET);
};

const getUser = async (address) => {
  const user = await User.findOne({
    where: {
      address,
    },
  });

  return user;
};

const getPk = async (address) => {
  const user = await getUser(address);

  const bytes = CryptoJS.AES.decrypt(user.pk, user.salt);
  const decryptedPk = bytes.toString(CryptoJS.enc.Utf8);

  return decryptedPk;
};

const sendTransaction = async (fromAddress, toAddress, pk, amount, req) => {
  // console.log(fromAddress, toAddress, pk, amount);

  let tx = {
    from: fromAddress,
    to: toAddress,
    value: req.web3.utils.toWei(amount, "ether"),
    gas: 21000,
  };
  // tx["gas"] = await req.web3.eth.estimateGas(tx);
  // console.log(tx);

  await req.web3.eth.accounts.privateKeyToAccount(pk);

  const signedTx = await req.web3.eth.accounts.signTransaction(tx, pk);
  // console.log(signedTx);

  // const signedTx = await ownerAccount.signTransaction(tx);
  return await req.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  // .on("receipt", console.log);
};

const createUser = async (req, password, address = null, privateKey = null) => {
  let newAccount;
  if (!address && !privateKey) {
    newAccount = await req.web3.eth.accounts.create();
    address = newAccount.address;
    privateKey = newAccount.privateKey;
  }
  const salt = makeSalt(18);

  // Encrypt
  const encryptedPk = CryptoJS.AES.encrypt(privateKey, salt).toString();

  // Decrypt
  // const bytes = CryptoJS.AES.decrypt(encryptedPk, salt);
  // const originalText = bytes.toString(CryptoJS.enc.Utf8);

  const user = await User.create({
    address,
    pk: encryptedPk,
    salt,
    password: CryptoJS.SHA256(password).toString(),
  });

  const token = getToken(user);

  return [address, privateKey, token];
};

const login = async (address, password, res) => {
  const user = await getUser(address);

  if (!user) {
    return res
      .status(404)
      .json({ message: "???????????? Address??? ???????????? ????????????." });
  }

  const passwordIsValid =
    CryptoJS.SHA256(password).toString() === user.password;

  if (!passwordIsValid) {
    return res.status(401).json({
      accessToken: null,
      message: "Address??? ???????????? Password??? ???????????? ????????????.",
    });
  }
  const token = getToken(user);

  return res.status(200).json({
    address: user.address,
    accessToken: token,
  });
};

module.exports = {
  createUser: async (req, res) => {
    try {
      const { password } = req.body;
      const [address, privateKey, token] = await createUser(req, password);

      res.status(200).send({
        newUser: { address, pk: privateKey, accessToken: token },
      });
    } catch (err) {
      console.log(err);
      res.status(404).send({
        message: "server error",
        errMsg: err,
      });
    }
  },
  restore: async (req, res) => {
    try {
      // pk, password ???????????? ?????????
      const { pk, password } = req.body;

      const account = await req.web3.eth.accounts.privateKeyToAccount(pk);
      // console.log(account);

      const user = await getUser(account.address);
      // console.log(user);
      if (user) {
        // console.log("1");
        // 1) user??? DB??? ?????? ??????
        // ??????????????? ????????? ??????
        // ?????????????????? ?????? ??????
        login(account.address, password, res);
      } else {
        // console.log("2");
        // 2) user??? DB??? ?????? ??????
        // ?????? ?????? ????????? ????????? ?????? ??????
        const [address, privateKey, token] = await createUser(
          req,
          password,
          account.address,
          pk
        );
        // console.log(address, privateKey, token);

        res.status(200).send({
          address,
          accessToken: token,
        });
      }
    } catch (e) {
      console.log(e);
      res.status(400).send({
        message: "server error",
        errMsg: e,
      });
    }
  },
  login: async (req, res) => {
    const { address, password } = req.body;

    login(address, password, res);
  },
  getUser: async (req, res) => {
    // console.log("--- Called getUser ---");
    // console.log(req.network);
    // console.log(req.web3);

    const address = req.address;
    const resBalance = req.web3.utils.fromWei(
      await req.web3.eth.getBalance(address),
      "ether"
    );
    // console.log(await req.web3.eth.getBlockNumber());
    // console.log(await req.web3.eth.net.getId());
    // console.log(resBalance);

    const user = await getUser(address);
    const myTx = await Tx.findAll({
      limit: 10,
      order: [["id", "DESC"]],
      where: {
        // network: req.cookies["network"],
        network: req.network,
        [Op.or]: [{ from: req.address }, { to: req.address }],
      },
    });

    // ???????????? 2?????? ????????? DB??? ????????? balance??? ???????????? ??????
    // ?????? ????????? ?????????????????? ????????? ???????????? ????????? ?????????????????? ??????
    // if (resBalance !== user.balance) {
    //   user.balance = resBalance;
    //   await user.save();
    // }

    return res.status(200).json({
      user: {
        address: user.address,
        balance: resBalance,
        myTx,
      },
    });
  },
  verifyToken: (req, res, next) => {
    const token = req.headers["x-access-token"];

    if (!token) {
      // return res.status(403).json("message: ????????? ?????? ????????? ??????????????????.");
      throw new Error("????????? ?????? ????????? ??????????????????.");
    } else {
      jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
          // return res
          //   .status(401)
          //   .json({ message: "???????????? ?????? ???????????????. ????????? ?????????????????????." });
          throw new Error("???????????? ?????? ???????????????. ????????? ?????????????????????.");
        } else {
          // console.log(decoded);
          req.address = decoded.address;
          next();
        }
      });
    }
  },
  transfer: async (req, res) => {
    try {
      const { toAddress, amount } = req.body;
      const fromAddress = req.address;
      // console.log(toAddress, fromAddress, amount);

      const pk = await getPk(fromAddress);
      const result = await sendTransaction(
        fromAddress,
        toAddress,
        pk,
        amount,
        req
      );

      if (result?.status !== null) {
        if (result.status) {
          console.log("?????? ??????");
          res.status(200).json({ message: "success" });
        } else {
          console.log("?????? ??????");
          res.status(400).json({ message: "fail" });
        }
      }
    } catch (e) {
      console.log(e);
      res.status(404).send({
        message: "server error",
        errMsg: e,
      });
    }
  },
};
