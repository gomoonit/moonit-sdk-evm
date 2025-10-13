import { SDKMigrationDex } from '../../domain';

export interface PrepareMintTxOptions {
  /**
   * Public key of the creator wallet
   * the wallet must sign this transaction
   */
  creator: string;

  /**
   * Token name (immutable)
   * @maxLength 32
   */
  name: string;

  /**
   * Token symbol (immutable)
   * @maxLength 32
   */
  symbol: string;

  /**
   * DEX to use for token migration
   */
  migrationDex: SDKMigrationDex;

  /**
   * Token icon encoded in base64 format
   * @maxLength 2097152 (2MB)
   */
  icon: string;

  /**
   * Token description
   * @maxLength 2000
   * @optional
   */
  description?: string;

  /**
   * Token amount that will be initially bought. Maximum 80% of total supply. In atomic units.
   * @example "1000000000"
   * @optional
   */
  tokenAmount?: string;

  /**
   * Token banner encoded in base64 format
   * @maxLength 5242880 (5MB)
   * @optional
   */
  banner?: string;

  /**
   * Website link
   */
  website?: string;

  /**
   * X link
   */
  x?: string;

  /**
   * Telegram link
   */
  telegram?: string;

  /**
   * Discord link
   */
  discord?: string;
}
