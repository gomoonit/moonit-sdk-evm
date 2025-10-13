export interface SubmitMintTxOptions {
  /**
   * Validity token
   * */
  token: string;

  /**
   * Transaction signed by creator wallet
   * */
  signedTransaction: string;
}
