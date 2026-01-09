/**
 * Tempo better-auth Plugin
 *
 * Extends passkey with Tempo blockchain address derivation and
 * provides Access Key endpoints for backend signing authorization.
 *
 * Features:
 * - Automatic Tempo address derivation from WebAuthn passkeys
 * - Access Key management for delegated signing
 * - KeyManager endpoints for Tempo SDK integration
 */

import type { BetterAuthPlugin } from 'better-auth';
import { TEMPO_ERROR_CODES } from './error-codes';
import {
  createAccessKey,
  createWallet,
  deletePasskey,
  getAccessKey,
  getChallenge,
  getPasskeyAuthenticationOptions,
  getPasskeyRegistrationOptions,
  getPublicKey,
  getWallet,
  listAccessKeys,
  listKeys,
  listTempoPasskeys,
  listWallets,
  revokeAccessKey,
  setPublicKey,
  verifyPasskeyAuthentication,
  verifyPasskeyRegistration,
} from './routes';
import { getSchema } from './schema';
import type { TempoPluginConfig } from './types';

// Module augmentation for better-auth type inference
// This registers the tempo plugin so auth.api.* can see the endpoints
declare module 'better-auth' {
  interface BetterAuthPluginRegistry {
    tempo: {
      creator: typeof tempo;
    };
  }
}

/**
 * Tempo better-auth plugin
 *
 * Handles passkey registration/authentication natively (no separate passkey() plugin needed).
 * Each passkey creates a Tempo wallet atomically.
 *
 * @example
 * ```typescript
 * import { tempo } from '@/lib/auth/tempo-plugin';
 *
 * export const auth = betterAuth({
 *   plugins: [
 *     tempo({
 *       passkey: {
 *         rpID: 'bountylane.xyz',
 *         rpName: 'BountyLane',
 *         origin: 'https://bountylane.xyz',
 *       },
 *       serverWallet: {
 *         address: '0x...',
 *         keyType: 'secp256k1',
 *       },
 *       allowedChainIds: [42429],
 *     }),
 *   ],
 * });
 * ```
 */
export const tempo = (config: TempoPluginConfig) => {
  return {
    id: 'tempo' as const,
    schema: getSchema(config),
    endpoints: {
      // Wallet endpoints
      listWallets,
      getWallet,
      createWallet,
      // Access Key endpoints (wallet-based, uses adapter)
      createAccessKey: createAccessKey(config),
      listAccessKeys,
      getAccessKey,
      revokeAccessKey,
      // Passkey registration & authentication
      getPasskeyRegistrationOptions: getPasskeyRegistrationOptions(config),
      verifyPasskeyRegistration: verifyPasskeyRegistration(config),
      getPasskeyAuthenticationOptions: getPasskeyAuthenticationOptions(config),
      verifyPasskeyAuthentication: verifyPasskeyAuthentication(config),
      deletePasskey,
      // Passkey list endpoint
      listTempoPasskeys,
      // KeyManager endpoints (SDK compatibility)
      getChallenge: getChallenge(config),
      getPublicKey,
      setPublicKey: setPublicKey(config),
      listKeys,
    },
    $ERROR_CODES: TEMPO_ERROR_CODES,
    options: config,
  } satisfies BetterAuthPlugin;
};

// Re-export types
export type { TempoPluginConfig } from './types';
export type * from './types';

// Re-export utilities for external use
export { coseKeyToHex, deriveTempoAddress } from './utils';
