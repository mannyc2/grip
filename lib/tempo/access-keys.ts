// lib/tempo/access-keys.ts
import { db } from '@/db';
import { getNetworkForInsert } from '@/db/network';
import { accessKeys } from '@/db/schema/business';
import { member, wallet } from '@/db/schema/auth';
import { and, eq } from 'drizzle-orm';

// ============================================================================
// ORGANIZATION ACCESS KEYS (Team member signs directly)
// ============================================================================

/**
 * Create Access Key for org team member
 *
 * Authorizes team member's passkey wallet to spend from org treasury.
 * - rootWallet = org owner's passkey wallet (account being controlled)
 * - keyWallet = team member's passkey wallet (authorized to sign)
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

  // Get org owner's passkey wallet (root - account being controlled)
  const orgOwner = await db.query.member.findFirst({
    where: and(eq(member.organizationId, params.orgId), eq(member.role, 'owner')),
  });

  if (!orgOwner) {
    throw new Error('Organization has no owner');
  }

  const rootWallet = await db.query.wallet.findFirst({
    where: and(eq(wallet.userId, orgOwner.userId), eq(wallet.walletType, 'passkey')),
  });

  if (!rootWallet) {
    throw new Error('Organization owner has no passkey wallet');
  }

  // Get team member's passkey wallet (key - authorized to sign)
  const teamMemberWallet = await db.query.wallet.findFirst({
    where: and(eq(wallet.userId, params.teamMemberUserId), eq(wallet.walletType, 'passkey')),
  });

  if (!teamMemberWallet) {
    throw new Error('Team member has no passkey wallet');
  }

  // Format limits as AccessKeyLimits (Record with initial/remaining)
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
      rootWalletId: rootWallet.id,
      keyWalletId: teamMemberWallet.id,
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
