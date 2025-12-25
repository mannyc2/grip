// lib/tempo/access-keys.ts
import { db } from '@/db';
import { getNetworkForInsert } from '@/db/network';
import { accessKeys } from '@/db/schema/business';
import { passkey } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';
import { BACKEND_WALLET_ADDRESSES } from './constants';

// ============================================================================
// PERSONAL ACCESS KEYS (Backend signs via Turnkey)
// ============================================================================

/**
 * Create dedicated Access Key for a single payment (personal/backend pattern)
 *
 * Dedicated Access Keys are single-use authorizations with exact amount limits.
 * Used for pending payments when a funder approves a bounty for a contributor without an account.
 *
 * Flow:
 * 1. Funder approves bounty for GitHub user without account
 * 2. Frontend prompts funder to sign KeyAuthorization (passkey signature)
 * 3. Backend calls this function to store the authorization
 * 4. Funds stay in funder's wallet (no custody)
 * 5. When contributor claims, we use this Access Key to sign transfer from funder's wallet
 * 6. Access Key is revoked after claim (single-use pattern)
 *
 * IMPORTANT: This requires funder to sign KeyAuthorization at approval time.
 * Cannot reuse existing Access Key signatures because limits are enforced on-chain
 * and there's no per-bounty scope in the authorization structure.
 *
 * @param params - Access Key creation parameters
 * @returns Created Access Key record
 */
export async function createDedicatedAccessKey(params: {
  userId: string;
  tokenAddress: string;
  amount: bigint;
  authorizationSignature: string;
  authorizationHash: string;
  chainId: number;
}) {
  const network = getNetworkForInsert();
  const backendWalletAddress = BACKEND_WALLET_ADDRESSES[network];

  // Set spending limit to exact payment amount (enforced on-chain)
  const limits = {
    [params.tokenAddress]: {
      initial: params.amount.toString(),
      remaining: params.amount.toString(),
    },
  };

  // 1 year expiration (same as pending payment expiration)
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60);

  const [key] = await db
    .insert(accessKeys)
    .values({
      userId: params.userId,
      organizationId: null,
      network,
      backendWalletAddress,
      authorizedUserPasskeyId: null,
      keyType: 'secp256k1',
      chainId: params.chainId,
      expiry,
      limits,
      authorizationSignature: params.authorizationSignature,
      authorizationHash: params.authorizationHash,
      status: 'active',
      label: 'Pending Payment',
      isDedicated: true, // Mark as dedicated (single-use)
    })
    .returning();

  return key;
}

// ============================================================================
// ORGANIZATION ACCESS KEYS (Team member signs directly)
// ============================================================================

/**
 * Create Access Key for org team member
 */
export async function createOrgAccessKey(params: {
  orgId: string;
  teamMemberUserId: string;
  spendingLimits: { tokenAddress: string; amount: bigint }[];
  expiryTimestamp?: number;
  authorizationSignature: string;
  authorizationHash: string;
  chainId: number;
  label?: string;
}) {
  const network = getNetworkForInsert();

  const teamMemberPasskey = await db.query.passkey.findFirst({
    where: eq(passkey.userId, params.teamMemberUserId),
  });

  if (!teamMemberPasskey?.tempoAddress) {
    throw new Error('Team member has no passkey with Tempo address');
  }

  const limits = params.spendingLimits.reduce(
    (acc, l) => {
      acc[l.tokenAddress] = {
        initial: l.amount.toString(),
        remaining: l.amount.toString(),
      };
      return acc;
    },
    {} as Record<string, { initial: string; remaining: string }>
  );

  const [key] = await db
    .insert(accessKeys)
    .values({
      userId: null,
      organizationId: params.orgId,
      network,
      backendWalletAddress: null,
      authorizedUserPasskeyId: teamMemberPasskey.id,
      keyType: 'webauthn',
      chainId: params.chainId,
      expiry: params.expiryTimestamp ? BigInt(params.expiryTimestamp) : null,
      limits,
      authorizationSignature: params.authorizationSignature,
      authorizationHash: params.authorizationHash,
      status: 'active',
      label: params.label ?? 'Team Access',
      isDedicated: false,
    })
    .returning();

  return key;
}

// ============================================================================
// SHARED
// ============================================================================

/**
 * Revoke Access Key (generic function for both personal and org keys)
 */
export async function revokeAccessKey(accessKeyId: string, reason: string) {
  await db
    .update(accessKeys)
    .set({
      status: 'revoked',
      revokedAt: new Date().toISOString(),
      revokedReason: reason,
    })
    .where(eq(accessKeys.id, accessKeyId));
}

/**
 * Revoke dedicated Access Key after payment claimed (backwards compatible wrapper)
 */
export const revokeDedicatedAccessKey = (id: string) => revokeAccessKey(id, 'Payment claimed');
