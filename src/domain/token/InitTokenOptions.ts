import { CurveType } from '@heliofi/launchpad-common';
import { ethers } from 'ethers';

import { Moonit } from '../moonit';

export interface InitTokenOptions {
  tokenAddress: string;
  moonshot: Moonit;
  curveType?: CurveType;
  provider?: ethers.JsonRpcProvider; // @deprecated
}
