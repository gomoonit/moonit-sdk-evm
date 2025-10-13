import {
  MoonshotFactory,
  MoonshotFactory__factory,
  MoonshotToken__factory,
} from '../../evm';
import { BigNumberish, ethers, Wallet } from 'ethers';
import { FixedSide } from '../token';
import { AmountAndFee } from './AmountAndFee';
import { MoonitInitOptions } from './MoonitInitOptions';
import { PrepareMintTxOptions } from './PrepareMintTxOptions';
import {
  MoonitApiAdapter,
  SubmitMintTxOptions,
  SubmitMintTxResponse,
} from '../../infra/moonit-api';
import { getMoonshotFactoryAddress } from '../utils/getMoonshotFactoryAddress';
import { Network } from './Network';
import { MigrationDex, MintTxPrepareResponse } from '@heliofi/launchpad-common';
import { SDKMigrationDex } from './MigrationDex';

export class Moonit {
  private factory: MoonshotFactory;

  private moonshotFactoryAddress: string;

  private signerWithProvider: Wallet;

  private apiAdapter: MoonitApiAdapter;

  private network: Network;

  constructor(options: MoonitInitOptions) {
    this.signerWithProvider = options.signer;

    const moonshotFactoryAddress = getMoonshotFactoryAddress(
      options.env,
      options.network,
    );

    this.moonshotFactoryAddress = moonshotFactoryAddress;
    this.network = options.network || Network.ABSTRACT;

    this.factory = MoonshotFactory__factory.connect(
      moonshotFactoryAddress,
      this.signerWithProvider,
    );

    this.apiAdapter = new MoonitApiAdapter(options.env, options.network);
  }

  async prepareMintTx(
    options: PrepareMintTxOptions,
  ): Promise<MintTxPrepareResponse> {
    return this.apiAdapter.prepareMint({
      ...options,
      creatorPK: options.creator,
      amount: options.tokenAmount,
      migrationDex: this.mapMigrationDexToCommonMigrationDex(
        options.migrationDex,
      ),
    });
  }

  async submitMintTx(
    options: SubmitMintTxOptions,
  ): Promise<SubmitMintTxResponse> {
    const res = await this.apiAdapter.submitMint(options);
    return {
      txSignature: res.transactionSignature,
      status: res.status,
    };
  }

  async buyExactOut(
    tokenAddress: string,
    tokenAmount: BigNumberish,
    maxCollateralAmount: BigNumberish,
  ): Promise<ethers.ContractTransactionResponse> {
    return this.factory.buyExactOut(
      tokenAddress,
      tokenAmount,
      maxCollateralAmount,
    );
  }

  async buyExactIn(
    tokenAddress: string,
    amountOutMin: BigNumberish,
  ): Promise<ethers.ContractTransactionResponse> {
    return this.factory.buyExactIn(tokenAddress, amountOutMin);
  }

  async sellExactOut(
    tokenAddress: string,
    tokenAmount: BigNumberish,
    maxCollateralAmount: BigNumberish,
  ): Promise<ethers.ContractTransactionResponse> {
    return this.factory.sellExactOut(
      tokenAddress,
      tokenAmount,
      maxCollateralAmount,
    );
  }

  async sellExactIn(
    tokenAddress: string,
    tokenAmount: BigNumberish,
    maxCollateralAmount: BigNumberish,
  ): Promise<ethers.ContractTransactionResponse> {
    return this.factory.sellExactIn(
      tokenAddress,
      tokenAmount,
      maxCollateralAmount,
    );
  }

  async getCurvePosition(tokenAddress: string): Promise<bigint> {
    const token = MoonshotToken__factory.connect(
      tokenAddress,
      this.signerWithProvider,
    );

    return token.balanceOf(tokenAddress);
  }

  async getAmountOutAndFee(
    tokenAddress: string,
    amountIn: bigint,
    paymentToken: FixedSide,
  ): Promise<AmountAndFee> {
    const token = MoonshotToken__factory.connect(
      tokenAddress,
      this.signerWithProvider,
    );

    let reserveIn: bigint;
    let reserveOut: bigint;

    if (paymentToken == FixedSide.IN) {
      reserveIn = await token.virtualCollateralReserves();
      reserveOut = await token.virtualTokenReserves();
    } else {
      reserveIn = await token.virtualTokenReserves();
      reserveOut = await token.virtualCollateralReserves();
    }

    const [amountOut, fee] = await token.getAmountOutAndFee(
      amountIn,
      reserveIn,
      reserveOut,
      paymentToken == FixedSide.IN,
    );

    return {
      amount: amountOut,
      fee,
    };
  }

  async getAmountInAndFee(
    tokenAddress: string,
    amountOut: bigint,
    paymentToken: FixedSide,
  ): Promise<AmountAndFee> {
    const token = MoonshotToken__factory.connect(
      tokenAddress,
      this.signerWithProvider,
    );

    let reserveIn: bigint;
    let reserveOut: bigint;

    if (paymentToken == FixedSide.OUT) {
      reserveIn = await token.virtualCollateralReserves();
      reserveOut = await token.virtualTokenReserves();
    } else {
      reserveIn = await token.virtualTokenReserves();
      reserveOut = await token.virtualCollateralReserves();
    }

    const [amountIn, fee] = await token.getAmountInAndFee(
      amountOut,
      reserveIn,
      reserveOut,
      paymentToken == FixedSide.OUT,
    );

    return {
      amount: amountIn,
      fee,
    };
  }

  getFactory(): MoonshotFactory {
    return this.factory;
  }

  getSignerWithProvider(): Wallet {
    return this.signerWithProvider;
  }

  getMoonshotFactoryAddress(): string {
    return this.moonshotFactoryAddress;
  }

  getNetwork(): Network {
    return this.network;
  }

  private mapMigrationDexToCommonMigrationDex(
    migrationDex: SDKMigrationDex,
  ): MigrationDex {
    if (this.network === Network.ABSTRACT) {
      return migrationDex === 'ABSTRACTSWAP'
        ? MigrationDex.UNISWAP
        : MigrationDex.AERODROME;
    }

    throw new Error('Unsupported network');
  }
}
