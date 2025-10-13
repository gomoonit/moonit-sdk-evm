import {
  ABSTRACT_MAINNET_ADDRESS,
  ABSTRACT_TESTNET_ADDRESS,
  Environment,
  Network,
} from '../moonshot';

export const getMoonshotFactoryAddress = (
  env: Environment,
  network: Network = Network.ABSTRACT,
): string => {
  if (network === Network.ABSTRACT) {
    if (env === Environment.MAINNET) {
      return ABSTRACT_MAINNET_ADDRESS;
    }

    return ABSTRACT_TESTNET_ADDRESS;
  }

  throw new Error(
    'Unsupported network, currently supporting Base, Abstract and Bera.',
  );
};
