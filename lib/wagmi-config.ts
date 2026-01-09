/**
 * Wagmi Configuration for Tempo SDK WebAuthn Connector
 *
 * This configures the Tempo SDK's webAuthn connector to work with our existing
 * better-auth passkey system. The KeyManager is configured to use our custom
 * HTTP endpoint that reads/writes to the existing passkey database table.
 *
 * Key architectural decision: We keep better-auth for passkey creation and
 * authentication, but use SDK's webAuthn connector for signing transactions.
 * This allows us to:
 * - Keep existing authentication flows unchanged
 * - Migrate signing to SDK for better maintainability
 * - Use a single passkey for both auth and transaction signing
 */

import { tempoTestnet } from 'viem/chains';
import { http, createConfig } from 'wagmi';
import { webAuthn } from 'wagmi/tempo';
import { tempoKeyManager } from '@/lib/auth/tempo-plugin/client';

/**
 * Wagmi configuration with Tempo's webAuthn connector
 *
 * Connector: webAuthn
 * - Enables signing transactions with WebAuthn P256 passkeys
 * - KeyManager backed by our custom HTTP endpoints
 * - Reads from existing passkey table in database
 *
 * multiInjectedProviderDiscovery: false
 * - Prevents auto-detection of injected wallets (MetaMask, etc.)
 * - Users should only use treasury passkeys, not external wallets
 */
export const config = createConfig({
  chains: [
    // Fee token not specified - protocol handles fallback chain:
    // Transaction → Account preference → Contract → pathUSD
    tempoTestnet,
  ],
  connectors: [
    webAuthn({
      // KeyManager from tempo plugin - stores public keys in database
      keyManager: tempoKeyManager,
    }),
  ],
  // Disable auto-detection of injected wallets
  // GRIP uses treasury passkeys only, not external wallets
  multiInjectedProviderDiscovery: false,
  transports: {
    [tempoTestnet.id]: http(
      process.env.NEXT_PUBLIC_TEMPO_RPC_URL ?? tempoTestnet.rpcUrls.default.http[0]
    ),
  },
});

/**
 * Type exports for use in components
 */
declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
