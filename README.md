# @moonit/sdk-evm

Moonit SDK for EVM helps calculate moonit token prices at any point in the bonding curve. The package also allows the users to generate buy and sell transactions, provide the slippage amount and fix it to a trading side.

By Following the example you can create your high-performance trading bot within minutes.

[npm link](https://www.npmjs.com/package/@moonit/evm-sdk)

## Installation

Install the package using `yarn` or `npm`

```shell
npm i @moonit/evm-sdk
# or
yarn add @moonit/evm-sdk
```

### Initialization

```typescript
import { Environment, Moonit, Network } from '@moonit/evm-sdk';

const provider = new JsonRpcProvider(process.env.RPC_URL as string);
const signer = new Wallet('private_key', provider);

const moonit = new Moonit({
  signer,
  env: Environment.TESTNET,
  network: Network.ABSTRACT,
});
```

### Buy example

```typescript
import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { Environment, FixedSide, Moonit, Token } from '@moonit/evm-sdk';

const buyExactIn = async (tokenAddress: string) => {
  const provider = new JsonRpcProvider(process.env.RPC_URL as string);
  const signer = new Wallet('private_key', provider);

  const moonit = new Moonit({
    signer,
    env: Environment.TESTNET,
  });

  const token = await Token.create({
    moonit,
    provider,
    tokenAddress,
  });

  const collateralAmount = ethers.parseEther('0.001');

  const tokenAmountForTransaction = await token.getTokenAmountByCollateral({
    collateralAmount,
    tradeDirection: 'BUY',
  });

  const slippageBps = 1000;

  const buyTx = await token.prepareTx({
    slippageBps,
    tokenAmount: tokenAmountForTransaction,
    collateralAmount: collateralAmount,
    tradeDirection: 'BUY',
    fixedSide: FixedSide.IN,
  });

  const walletAddress = await signer.getAddress();

  const feeData = await provider.getFeeData();

  const nonce = await provider.getTransactionCount(walletAddress, 'latest');

  const enrichedBuyTx = {
    ...buyTx,
    gasPrice: feeData.gasPrice,
    nonce: nonce,
    from: walletAddress,
  };

  const buyTxGasLimit = await provider.estimateGas(enrichedBuyTx);

  const buyTxResponse = await signer.sendTransaction({
    ...buyTx,
    gasLimit: buyTxGasLimit,
  });

  const buyTxReceipt = await buyTxResponse.wait();

  if (buyTxReceipt?.status === 1) {
    const balance = await token.balanceOf(walletAddress);

    console.log(balance);
  }
};
```

### Sell example

```typescript
import { JsonRpcProvider, Wallet } from 'ethers';
import { Environment, FixedSide, Moonit, Token } from '@moonit/evm-sdk';

const sellExactIn = async (tokenAddress: string) => {
  const provider = new JsonRpcProvider(process.env.RPC_URL as string);
  const signer = new Wallet('private_key', provider);

  const walletAddress = await signer.getAddress();

  const moonit = new Moonit({
    signer,
    env: Environment.TESTNET,
  });
  const token = await Token.create({
    moonit,
    provider,
    tokenAddress,
  });

  const tokenAmount = await token.balanceOf(walletAddress);

  await token.approveForMoonitSell(tokenAmount);

  const collateralAmountForTransaction =
    await token.getCollateralAmountByTokens({
      tokenAmount,
      tradeDirection: 'BUY',
    });

  const slippageBps = 1000;

  const sellTx = await token.prepareTx({
    slippageBps,
    tokenAmount,
    collateralAmount: collateralAmountForTransaction,
    tradeDirection: 'SELL',
    fixedSide: FixedSide.IN,
  });

  const feeData = await provider.getFeeData();

  const nonce = await provider.getTransactionCount(walletAddress, 'latest');

  const enrichedSellTx = {
    ...sellTx,
    gasPrice: feeData.gasPrice,
    nonce: nonce,
    from: walletAddress,
  };

  const sellTxGasLimit = await provider.estimateGas(enrichedSellTx);

  const sellTxResponse = await signer.sendTransaction({
    ...enrichedSellTx,
    gasLimit: sellTxGasLimit,
  });

  const sellTxReceipt = await sellTxResponse.wait();

  if (sellTxReceipt?.status === 1) {
    const balance = await token.balanceOf(walletAddress);

    console.log(balance);
  }
};
```

### Mint example

```typescript
import {
  Environment,
  MigrationDex,
  MintTokenCurveType,
  Moonit,
} from '@moonit/evm-sdk';
import { JsonRpcProvider, Transaction, Wallet } from 'ethers';

const mintTx = async () => {
  const provider = new JsonRpcProvider(process.env.RPC_URL as string);
  const signer = new Wallet('private_key', provider);

  const moonit = new Moonit({
    signer,
    env: Environment.TESTNET,
    network: Network.ABSTRACT,
  });

  const mockImg = 'data:image/png;base64,...';

  const prepMint = await moonit.prepareMintTx({
    name: 'TEST_TOKEN',
    symbol: 'TEST_TOKEN',
    migrationDex: 'ABOREAN',
    icon: mockImg,
    description: 'TEST_TOKEN',
    x: 'https://x.com',
    banner: mockImg,
    creator: await signer.getAddress(),
    tokenAmount: '163943390006858329570895',
  });

  const deserializedTransaction = Transaction.from(
    prepMint.transaction,
  ).toJSON();

  const walletAddress = await signer.getAddress();

  const feeData = await provider.getFeeData();

  const tx = {
    to: deserializedTransaction.to,
    data: deserializedTransaction.data,
    value: deserializedTransaction.value,
    chainId: deserializedTransaction.chainId,
    gasPrice: feeData.gasPrice,
    from: walletAddress,
    nonce: await provider.getTransactionCount(walletAddress, 'latest'),
  };

  const gasLimit = await provider.estimateGas(tx);

  const txResponse = await signer.sendTransaction({
    ...tx,
    gasLimit,
  });

  const receipt = await txResponse.wait();

  if (receipt?.status === 1) {
    const res = await moonit.submitMintTx({
      token: prepMint.token,
      signedTransaction: JSON.stringify(txResponse),
    });

    const createdTokenAddress = receipt?.logs[2].address;

    console.log(createdTokenAddress);
  }
};
```
