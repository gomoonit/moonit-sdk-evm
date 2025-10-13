import { ethers } from 'ethers';
import { Environment } from './Environment';
import { Network } from './Network';

export interface MoonitInitOptions {
  signer: ethers.Wallet;
  env: Environment;
  network?: Network;
}
