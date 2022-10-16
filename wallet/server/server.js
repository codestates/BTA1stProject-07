const express = require('express');
const router = express.Router();
const lightwallet = require("eth-lightwallet");
const fs = require('fs');
//import bip39 from 'bip39';
const converter = require('bech32-converting');

const Kava = require('@kava-labs/javascript-sdk');
let shardURL = 'https://api.testnet.kava.io'; //앤드포인트 URL



/*
 *  /api
 */

// TODO : 
router.post("/getAddressFromMnemonic", async (req, res) => {
    try {
      const mnemonic = lightwallet.keystore.generateRandomSeed();
      return res.json({ mnemonic });
    } catch (err) {
      console.log(err);
    }
  });


// TODO : 니모닉 코드와 패스워드를 이용해 keystore와 address를 생성합니다.
router.post("/newWallet", async (req, res) => {
    const { password, mnemonic } = req.body;
    try {
      lightwallet.keystore.createVault(
        {
          password: password,
          seedPhrase: mnemonic,
          hdPathString: "m/0'/0'/0'",
        },
        function (err, ks) {
          ks.keyFromPassword(password, function (err, pwDerivedKey) {
            ks.generateNewAddress(pwDerivedKey, 1);
            const address = ks.getAddresses().toString();
            const keystore = ks.serialize();
  
            fs.writeFile("wallet.json", keystore, function (err, data) {
              if (err) {
                return res.json({ code: 999, message: "실패" });
              }
              return res.json({ code: 1, message: "성공" });
            });
          });
        }
      );
    } catch (err) {
      console.log(err);
    }
  });
  
 
  module.exports = router;