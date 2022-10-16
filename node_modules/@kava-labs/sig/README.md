# Sig

Sig is a signing library for Cosmos which we've modified for compatibility with Kava.

Sig provides JavaScript functions and TypeScript types for

- Deriving a wallet (private key, public key, and address) from a mnemonic
- Deriving an address from a public key
- Structuring a transaction
- Signing a transaction
- Verifying signatures for a transaction
- Preparing a transaction for broadcast

Sig **does not** provide functions for

- Generating a mnemonic
- Storing keys or other secrets
- Obtaining data from a chain
- Broadcasting transactions

Sig is designed to work well with other libraries like

- [`bip39`](https://github.com/bitcoinjs/bip39)
- [`bip32`](https://github.com/bitcoinjs/bip32)
- [`@tendermint/amino-js`](https://github.com/cosmos/amino-js)

Sig is experimental and not recommended for use in production yet. Please help us test and improve it!

As always, please be careful to protect any mnemonic phrases, passwords, and private keys.

### Demo

- [Node.js](https://repl.it/repls/DodgerblueAshamedTest)
- [Browser](https://jsfiddle.net/pbc6zkeh/)

### Documentation

**https://cosmos.github.io/sig/**

### Install

Please note that the NPM package name is `@kava-labs/sig` rather than `@cosmos/sig`.

#### Yarn

```shell
yarn add @kava-labs/sig
```

#### NPM

```shell
npm install --save @kava-labs/sig
```

### Usage

#### Derive a wallet (private key, public key, and address) from a mnemonic

```typescript
import { createWalletFromMnemonic } from '@kava-labs/sig';

const mnemonic =
  'trouble salon husband push melody usage fine ensure blade deal miss twin';

const wallet = createWalletFromMnemonic(mnemonic); // BIP39 mnemonic string
/*
{
    address:    'cosmos1asm039pzjkkg9ghlvj267p5g3whtxd2t4leg5c',
    privateKey: Uint8Array [
        202,  60, 140, 106, 178, 180,  60,   1,
        186,  68, 206, 224, 207, 179,  79,  81,
        119,  98,  98,   1, 207, 170, 209, 161,
          1, 124, 151, 236, 205, 151,   3, 229
    ],
    publicKey:  Uint8Array [
          3, 159,  35,  41, 130,  48,   3, 247,
        139, 242, 113,  41, 200, 176,  73,  27,
        102, 232, 113, 226,  80, 184, 107, 144,
        217,  88, 151,  21,  22, 185,  68,  28,
        211
    ]
}
*/
```

#### Derive a Bech32 address from a public key

```typescript
import { createAddress } from '@kava-labs/sig';

const address = createAddress(publicKey); // Buffer or Uint8Array
// 'cosmos1asm039pzjkkg9ghlvj267p5g3whtxd2t4leg5c'
```

#### Sign a transaction

```typescript
import { signTx } from '@kava-labs/sig';

const tx = {
  type: 'cosmos-sdk/StdTx',
  value: {
    msg: [
      {
        type: 'cosmos-sdk/MsgSend',
        value: {
          from_address: 'cosmos1qperwt9wrnkg5k9e5gzfgjppzpqhyav5j24d66',
          to_address: 'cosmos1yeckxz7tapz34kjwnjxvmxzurerquhtrmxmuxt',
          amount: [
            {
              denom: 'stake',
              amount: '1',
            },
          ],
        },
      },
    ],
    fee: {
      amount: [],
      gas: '200000',
    },
    signatures: null,
    memo: '',
  },
};

const signMeta = {
  account_number: '1',
  chain_id: 'testing',
  sequence: '0',
};

const stdTx = signTx(tx, signMeta, wallet); // Wallet or privateKey / publicKey pair; see example above
/*
{
  "type": "cosmos-sdk/StdTx",
  "value": {
    "msg": [
      {
        "type": "cosmos-sdk/MsgSend",
        "value": {
          "from_address": "cosmos1qperwt9wrnkg5k9e5gzfgjppzpqhyav5j24d66",
          "to_address": "cosmos1yeckxz7tapz34kjwnjxvmxzurerquhtrmxmuxt",
          "amount": [
            {
              "denom": "stake",
              "amount": "1"
            }
          ]
        }
      }
    ],
    "fee": {
      "amount": [],
      "gas": "200000"
    },
    "memo": "",
    "signatures": [
      {
        "signature": "UA8vJJNInQ3ZujCdW2W31ID5julF404Zx63RIdeDXOtLQepwrO6W1mu3NRtd4HAce8PnYC5qQcjQ7vZUnmQ05A==",
        "pub_key": {
          "type": "tendermint/PubKeySecp256k1",
          "value": "A58jKYIwA/eL8nEpyLBJG2boceJQuGuQ2ViXFRa5RBzT"
        }
      }
    ]
  }
}
*/
```

#### Verify a transaction

```typescript
import { verifyTx } from '@kava-labs/sig';

const valid = verifyTx(stdTx, signMeta); // signed transaction and metadata; see example above
// true
```

Please see the [documentation](https://cosmos.github.io/sig/) for the full API.

### Building

```shell
git clone https://github.com/kava-labs/sig.git
cd sig
yarn install
yarn setup
yarn test
```

### Contributing

Sig is very new! Questions, feedback, use cases, issues, and code are all very, very welcome.

Thank you for helping us help you help us all. 🎁

### Alternatives

A number of other projects exist that help with signing for Cosmos.

Please check them out and see if they are right for you!

- [`@lunie/cosmos-keys`](https://github.com/luniehq/cosmos-keys)
- [`@cosmostation/cosmosjs`](https://github.com/cosmostation/cosmosjs)
- [`@iov/cosmos`](https://github.com/iov-one/iov-core/tree/1220-cosmos-codec/packages/iov-cosmos)
- [`@everett-protocol/cosmosjs`](https://github.com/everett-protocol/cosmosjs)
- [`js-cosmos-wallet`](https://github.com/okwme/js-cosmos-wallet)
- [`cosmos-client-ts`](https://github.com/lcnem/cosmos-client-ts)
- [`lotion`](https://github.com/nomic-io/lotion)
