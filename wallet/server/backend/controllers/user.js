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
      .json({ message: "입력하신 Address는 존재하지 않습니다." });
  }

  const passwordIsValid =
    CryptoJS.SHA256(password).toString() === user.password;

  if (!passwordIsValid) {
    return res.status(401).json({
      accessToken: null,
      message: "Address에 해당하는 Password가 일치하지 않습니다.",
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
      // pk, password 입력으로 받는다
      const { pk, password } = req.body;

      const account = await req.web3.eth.accounts.privateKeyToAccount(pk);
      // console.log(account);

      const user = await getUser(account.address);
      // console.log(user);
      if (user) {
        // console.log("1");
        // 1) user가 DB에 있는 경우
        // 패스워드가 맞는지 확인
        // 로그인시켜서 토큰 반환
        login(account.address, password, res);
      } else {
        // console.log("2");
        // 2) user가 DB에 없는 경우
        // 유저 생성 로직을 거치고 토큰 반환
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

    // 네트워크 2개기 때문에 DB에 저장된 balance는 사용하지 않음
    // 현재 연결된 네트워크에서 가져온 밸런스를 그대로 프론트엔드로 전달
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
      // return res.status(403).json("message: 인증을 위한 토큰을 전송해주세요.");
      throw new Error("인증을 위한 토큰을 전송해주세요.");
    } else {
      jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
          // return res
          //   .status(401)
          //   .json({ message: "유효하지 않은 토큰입니다. 인증에 실패하였습니다." });
          throw new Error("유효하지 않은 토큰입니다. 인증에 실패하였습니다.");
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
          console.log("거래 성공");
          res.status(200).json({ message: "success" });
        } else {
          console.log("거래 실패");
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
