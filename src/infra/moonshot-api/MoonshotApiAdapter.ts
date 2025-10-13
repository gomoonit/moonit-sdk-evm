import { Environment, Network } from '../../domain';
import { ApiClient } from '../http';
import {
  CreateMintResponse,
  CreateMintWithMetadataDto,
  MintTxPrepareDto,
  MintTxPrepareResponse,
  MintTxSubmitDto,
  MintTxSubmitResponse,
} from '@heliofi/launchpad-common';

export class MoonshotApiAdapter {
  private apiClient: ApiClient;

  private readonly env: Environment;

  private readonly network: Network;

  constructor(environment: Environment, network: Network = Network.ABSTRACT) {
    const apiBasePath =
      environment === Environment.MAINNET
        ? 'https://api.mintlp.io/v1'
        : 'https://api.dev.mintlp.io/v1';

    this.env = environment;
    this.network = network;
    this.apiClient = new ApiClient({ apiBasePath });
  }

  async prepareMint(
    createAndPrepareMintDto: CreateMintWithMetadataDto & MintTxPrepareDto,
  ): Promise<MintTxPrepareResponse> {
    const { amount, creatorPK, ...createMintDto } = createAndPrepareMintDto;

    const { pairId } = await this.createMint(createMintDto);

    return this.apiClient.publicRequest(`abstract/${pairId}/sdk`, {
      method: 'POST',
      data: {
        amount,
        creatorPK,
      },
    });
  }

  submitMint(submitDto: MintTxSubmitDto): Promise<MintTxSubmitResponse> {
    return this.apiClient.authedRequest('/abstract/sdk', 'TMP_TOKEN', {
      method: 'POST',
      data: submitDto,
    });
  }

  private async createMint(
    createMintDto: CreateMintWithMetadataDto,
  ): Promise<CreateMintResponse> {
    if (this.network === Network.ABSTRACT) {
      return this.apiClient.publicRequest(`/create/abstract/metadata/sdk`, {
        method: 'POST',
        data: createMintDto,
      });
    }

    throw new Error('Unsupported network');
  }
}
