/**
 * Tempo Client Plugin
 *
 * Client-side API for Tempo plugin endpoints.
 * Includes built-in WebAuthn ceremony handling for passkey registration/authentication.
 */

import type { BetterAuthClientPlugin } from 'better-auth/client';
import type { BetterFetch } from '@better-fetch/fetch';
import { KeyManager } from 'wagmi/tempo';
import { connect, getConnections, getConnectors, signMessage } from 'wagmi/actions';
import { KeyAuthorization } from 'ox/tempo';
import { startAuthentication, startRegistration, WebAuthnError } from '@simplewebauthn/browser';
import type { Config } from 'wagmi';
import type { tempo } from '.';
import type {
  AccessKeyStatus,
  AuthenticatePasskeyResponse,
  CreateAccessKeyRequest,
  CreateAccessKeyResponse,
  DeletePasskeyResponse,
  GetAccessKeyResponse,
  GetWalletResponse,
  KeyManagerKey,
  ListAccessKeysResponse,
  ListWalletsResponse,
  LoadKeyResponse,
  PasskeyWithAddress,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegisterPasskeyResponse,
  RevokeAccessKeyRequest,
  RevokeAccessKeyResponse,
  SaveKeyResponse,
  SetPublicKeyRequest,
  Wallet,
} from './types';

/**
 * Simple KeyManager using HTTP endpoints
 *
 * Uses KeyManager.http for basic integration. For better cookie handling
 * with better-auth, use createTempoKeyManager instead.
 */
export const tempoKeyManager = KeyManager.http('/api/auth/tempo/keymanager');

/**
 * Helper to convert browser's ArrayBuffer to base64url string
 */
function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * KeyManager for Tempo SDK WebAuthn connector
 *
 * Factory that creates a KeyManager using better-auth client actions.
 * This ensures consistent cookie handling and type safety.
 *
 * @example
 * ```typescript
 * import { createTempoKeyManager } from '@/lib/auth/tempo-plugin/client';
 * import { authClient } from '@/lib/auth/auth-client';
 *
 * const keyManager = createTempoKeyManager(authClient);
 *
 * // Use with wagmi
 * webAuthn({ keyManager });
 * ```
 */
export function createTempoKeyManager(authClient: {
  tempo: ReturnType<typeof getTempoActions>;
}) {
  return KeyManager.from({
    async getChallenge() {
      const { data, error } = await authClient.tempo.getChallenge();
      if (error || !data) {
        throw new Error(error?.message ?? 'Failed to get challenge');
      }
      return data;
    },

    async getPublicKey({ credential }) {
      const { data, error } = await authClient.tempo.loadKey(credential.id);
      if (error || !data) {
        throw new Error(error?.message ?? 'Public key not found');
      }
      return data.publicKey as `0x${string}`;
    },

    async setPublicKey({ credential, publicKey }) {
      // Convert browser's PublicKeyCredential to our API format (base64url strings)
      const response = credential.response as AuthenticatorAttestationResponse;
      const credentialRaw = {
        id: credential.id,
        response: {
          clientDataJSON: arrayBufferToBase64url(response.clientDataJSON),
          attestationObject: arrayBufferToBase64url(response.attestationObject),
          transports: response.getTransports?.() as string[] | undefined,
        },
      };

      const { error } = await authClient.tempo.saveKey(credential.id, {
        credential: credentialRaw,
        publicKey,
      });
      if (error) {
        throw new Error(error.message ?? 'Failed to save public key');
      }
    },
  });
}

// ============================================================================
// TYPES
// ============================================================================

export interface SignKeyAuthorizationParams {
  config: Config;
  keyType: 'secp256k1' | 'webAuthn';
  address: `0x${string}`;
  limits: { token: `0x${string}`; amount: bigint }[];
  expiry?: number;
}

export interface SignKeyAuthorizationResponse {
  signature: `0x${string}`;
  hash: `0x${string}`;
}

// ============================================================================
// ACTIONS
// ============================================================================

export const getTempoActions = ($fetch: BetterFetch) => {
  // Wallet management
  const listWallets = async () => {
    return $fetch<ListWalletsResponse>('/tempo/wallets', {
      method: 'GET',
    });
  };

  const getWallet = async (idOrAddress: string) => {
    return $fetch<GetWalletResponse>(`/tempo/wallets/${idOrAddress}`, {
      method: 'GET',
    });
  };

  /**
   * Get the user's primary passkey wallet
   *
   * Convenience method that finds the first passkey wallet.
   * Returns null if user has no passkey wallets.
   */
  const getPasskeyWallet = async (): Promise<{ data: Wallet | null; error: Error | null }> => {
    const result = await listWallets();
    if (result.error) {
      const err = result.error;
      return { data: null, error: new Error(err.message ?? 'Failed to list wallets') };
    }
    const passkeyWallet = result.data?.wallets.find((w) => w.walletType === 'passkey') ?? null;
    return { data: passkeyWallet, error: null };
  };

  // Access Key management
  const listAccessKeys = async (params?: {
    status?: AccessKeyStatus;
    direction?: 'granted' | 'received';
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) {
      searchParams.set('status', params.status);
    }
    if (params?.direction) {
      searchParams.set('direction', params.direction);
    }

    const url = `/tempo/access-keys${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return $fetch<ListAccessKeysResponse>(url, {
      method: 'GET',
    });
  };

  const createAccessKey = async (params: CreateAccessKeyRequest) => {
    return $fetch<CreateAccessKeyResponse>('/tempo/access-keys', {
      method: 'POST',
      body: params,
    });
  };

  const getAccessKey = async (id: string) => {
    return $fetch<GetAccessKeyResponse>(`/tempo/access-keys/${id}`, {
      method: 'GET',
    });
  };

  const revokeAccessKey = async (id: string, params?: RevokeAccessKeyRequest) => {
    return $fetch<RevokeAccessKeyResponse>(`/tempo/access-keys/${id}`, {
      method: 'DELETE',
      body: params ?? {}, // better-auth requires Content-Type which needs a body
    });
  };

  // ============================================================================
  // Passkey Registration & Authentication (with ceremony handling)
  // ============================================================================

  /**
   * Register a new passkey (handles full WebAuthn ceremony)
   *
   * 1. Fetches registration options from server
   * 2. Runs WebAuthn ceremony in browser (biometric prompt)
   * 3. Verifies with server and creates passkey + wallet atomically
   *
   * @example
   * const result = await authClient.registerPasskey({ name: 'My Wallet' });
   * if (result.data) {
   *   console.log('Wallet created:', result.data.wallet.address);
   * }
   */
  const registerPasskey = async (opts?: {
    name?: string;
    authenticatorAttachment?: 'platform' | 'cross-platform';
  }) => {
    // 1. Get registration options from server
    const options = await $fetch<PublicKeyCredentialCreationOptionsJSON>(
      '/tempo/passkey/register-options',
      { method: 'GET', throw: false }
    );

    if (!options.data) {
      return options;
    }

    try {
      // 2. Run WebAuthn ceremony in browser
      const credential = await startRegistration({
        optionsJSON: options.data,
      });

      // 3. Verify with server and create passkey + wallet
      return $fetch<RegisterPasskeyResponse>('/tempo/passkey/register', {
        method: 'POST',
        body: { response: credential, name: opts?.name },
        throw: false,
      });
    } catch (e) {
      // Handle WebAuthn-specific errors
      if (e instanceof WebAuthnError) {
        if (e.code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED') {
          return {
            data: null,
            error: {
              code: e.code,
              message: 'This passkey is already registered',
              status: 400,
              statusText: 'BAD_REQUEST',
            },
          };
        }
        if (e.code === 'ERROR_CEREMONY_ABORTED') {
          return {
            data: null,
            error: {
              code: e.code,
              message: 'Registration cancelled',
              status: 400,
              statusText: 'BAD_REQUEST',
            },
          };
        }
        return {
          data: null,
          error: {
            code: e.code,
            message: e.message,
            status: 400,
            statusText: 'BAD_REQUEST',
          },
        };
      }
      return {
        data: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: e instanceof Error ? e.message : 'Unknown error',
          status: 500,
          statusText: 'INTERNAL_SERVER_ERROR',
        },
      };
    }
  };

  /**
   * Authenticate with passkey (handles full WebAuthn ceremony)
   *
   * 1. Fetches authentication options from server
   * 2. Runs WebAuthn ceremony in browser (biometric prompt)
   * 3. Verifies with server and creates session
   *
   * @example
   * const result = await authClient.authenticateWithPasskey();
   * if (result.data) {
   *   console.log('Signed in as:', result.data.user.email);
   * }
   */
  const authenticateWithPasskey = async (opts?: {
    autoFill?: boolean;
  }) => {
    // 1. Get authentication options from server
    const options = await $fetch<PublicKeyCredentialRequestOptionsJSON>(
      '/tempo/passkey/authenticate-options',
      { method: 'GET', throw: false }
    );

    if (!options.data) {
      return options;
    }

    try {
      // 2. Run WebAuthn ceremony in browser
      const assertion = await startAuthentication({
        optionsJSON: options.data,
        useBrowserAutofill: opts?.autoFill,
      });

      // 3. Verify with server and create session
      return $fetch<AuthenticatePasskeyResponse>('/tempo/passkey/authenticate', {
        method: 'POST',
        body: { response: assertion },
        throw: false,
      });
    } catch (e) {
      console.error('[Tempo] Passkey authentication error:', e);
      return {
        data: null,
        error: {
          code: 'AUTH_CANCELLED',
          message: 'Authentication cancelled',
          status: 400,
          statusText: 'BAD_REQUEST',
        },
      };
    }
  };

  /**
   * Delete a passkey (wallet cascades via FK)
   * @param credentialId - The WebAuthn credential ID
   */
  const deletePasskey = async (credentialId: string) => {
    return $fetch<DeletePasskeyResponse>(`/tempo/passkey/${credentialId}`, {
      method: 'DELETE',
      body: {}, // better-auth requires Content-Type which needs a body
    });
  };

  // Low-level endpoints for advanced use cases
  const getPasskeyRegistrationOptions = async () => {
    return $fetch<PublicKeyCredentialCreationOptionsJSON>('/tempo/passkey/register-options', {
      method: 'GET',
    });
  };

  const getPasskeyAuthenticationOptions = async () => {
    return $fetch<PublicKeyCredentialRequestOptionsJSON>('/tempo/passkey/authenticate-options', {
      method: 'GET',
    });
  };

  // Passkey listing
  const listTempoPasskeys = async () => {
    return $fetch<PasskeyWithAddress[]>('/tempo/passkeys', {
      method: 'GET',
    });
  };

  // KeyManager (Tempo SDK integration)
  const listKeys = async () => {
    return $fetch<KeyManagerKey[]>('/tempo/keymanager', {
      method: 'GET',
    });
  };

  /**
   * Get WebAuthn challenge for SDK registration flow
   *
   * Returns challenge (hex) and RP info for client-side WebAuthn ceremony.
   * Challenge is stored server-side for validation in saveKey.
   */
  const getChallenge = async () => {
    return $fetch<{ challenge: `0x${string}`; rp: { id: string; name: string } }>(
      '/tempo/keymanager/challenge',
      { method: 'GET' }
    );
  };

  const loadKey = async (credentialId: string) => {
    return $fetch<LoadKeyResponse>(`/tempo/keymanager/${credentialId}`, {
      method: 'GET',
    });
  };

  /**
   * Save public key after WebAuthn registration
   *
   * SECURITY: Server extracts and validates public key from credential.attestationObject.
   * The publicKey field in params is IGNORED by the server.
   *
   * @param credentialId - The credential ID from WebAuthn response
   * @param params - Must include credential with attestationObject from WebAuthn ceremony
   */
  const saveKey = async (credentialId: string, params: SetPublicKeyRequest) => {
    return $fetch<SaveKeyResponse>(`/tempo/keymanager/${credentialId}`, {
      method: 'POST',
      body: params,
    });
  };

  /**
   * Sign a KeyAuthorization with the user's passkey
   *
   * Handles wagmi connection if needed, builds the authorization struct,
   * and prompts the user for passkey signature.
   *
   * @example
   * const { data, error } = await authClient.signKeyAuthorization({
   *   config,
   *   keyType: 'secp256k1',
   *   address: backendWalletAddress,
   *   limits: [{ token: tokenAddress, amount: BigInt(1000) * BigInt(1_000_000) }],
   * });
   */
  const signKeyAuthorization = async (
    params: SignKeyAuthorizationParams
  ): Promise<{ data: SignKeyAuthorizationResponse | null; error: Error | null }> => {
    try {
      const { config, keyType, address, limits, expiry } = params;

      // Connect if not connected
      const connections = getConnections(config);
      if (connections.length === 0) {
        const connectors = getConnectors(config);
        const webAuthnConnector = connectors.find(
          (c) => c.id === 'webAuthn' || c.type === 'webAuthn'
        );
        if (!webAuthnConnector) {
          return { data: null, error: new Error('WebAuthn connector not available') };
        }
        await connect(config, { connector: webAuthnConnector });
      }

      // Build authorization struct
      const authorization = KeyAuthorization.from({
        chainId: BigInt(42429),
        type: keyType,
        address,
        limits: limits.map((l) => ({ token: l.token, limit: l.amount })),
        ...(expiry && { expiry }),
      });

      // Get hash and sign with passkey
      const hash = KeyAuthorization.getSignPayload(authorization);
      const signature = await signMessage(config, { message: { raw: hash } });

      return {
        data: { signature: signature as `0x${string}`, hash },
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to sign authorization'),
      };
    }
  };

  return {
    // Wallets
    listWallets,
    getWallet,
    getPasskeyWallet,
    // Access Keys
    listAccessKeys,
    createAccessKey,
    getAccessKey,
    revokeAccessKey,
    // Passkey registration & authentication
    getPasskeyRegistrationOptions,
    registerPasskey,
    getPasskeyAuthenticationOptions,
    authenticateWithPasskey,
    deletePasskey,
    listTempoPasskeys,
    // KeyManager
    getChallenge,
    listKeys,
    loadKey,
    saveKey,
    // Signing
    signKeyAuthorization,
  };
};

// ============================================================================
// PLUGIN
// ============================================================================

/**
 * Tempo client plugin for better-auth
 *
 * Provides client-side API for Tempo plugin endpoints:
 * - Passkey Registration/Auth: Register passkeys, authenticate with passkeys
 * - Wallets: List user's wallets, get passkey wallet
 * - Access Keys: Create, list, get, revoke
 * - KeyManager: Tempo SDK integration for signing
 * - signKeyAuthorization: Sign Access Key authorizations with passkey
 *
 * @example
 * ```typescript
 * import { authClient } from '@/lib/auth/auth-client';
 * import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
 *
 * // Register a new passkey (creates wallet atomically)
 * const { data: regOptions } = await authClient.getPasskeyRegistrationOptions();
 * const credential = await startRegistration(regOptions);
 * const { data: result } = await authClient.registerPasskey({
 *   response: credential,
 *   name: 'My Passkey',
 * });
 * console.log('Wallet created:', result.wallet.address);
 *
 * // Authenticate with passkey
 * const { data: authOptions } = await authClient.getPasskeyAuthenticationOptions();
 * const assertion = await startAuthentication(authOptions);
 * const { data: session } = await authClient.authenticateWithPasskey({
 *   response: assertion,
 * });
 * ```
 */
export const tempoClient = () => {
  return {
    id: 'tempo',
    $InferServerPlugin: {} as ReturnType<typeof tempo>,
    getActions: ($fetch) => getTempoActions($fetch),
  } satisfies BetterAuthClientPlugin;
};

// Re-exports
export * from './error-codes';
export type * from './types';
