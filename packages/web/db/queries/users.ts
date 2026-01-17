import { account, bounties, db, payouts, user, wallet } from '@/db';
import { member } from '@/db/schema/auth';
import { and, eq, sql } from 'drizzle-orm';
import { chainIdFilter } from '../network';

/**
 * Get user by name with computed stats and wallet address
 *
 * Computes stats from payouts (no cached user_stats table).
 * Joins with wallet table for passkey wallet address.
 */
export async function getUserByName(name: string) {
  const [result] = await db
    .select({
      user: user,
      wallet: {
        address: wallet.address,
      },
    })
    .from(user)
    .leftJoin(wallet, and(eq(wallet.userId, user.id), eq(wallet.walletType, 'passkey')))
    .where(eq(user.name, name))
    .limit(1);

  if (!result) return null;

  // Compute stats from payouts (network-aware)
  const [stats] = await db
    .select({
      totalEarned: sql<number>`coalesce(sum(${payouts.amount}), 0)::bigint`,
      bountiesCompleted: sql<number>`count(distinct ${payouts.bountyId})::int`,
    })
    .from(payouts)
    .where(
      and(
        chainIdFilter(payouts),
        eq(payouts.recipientUserId, result.user.id),
        eq(payouts.status, 'confirmed')
      )
    );

  return {
    id: result.user.id,
    name: result.user.name,
    email: result.user.email,
    image: result.user.image,
    createdAt: result.user.createdAt,
    githubUserId: result.user.githubUserId,
    tempoAddress: result.wallet?.address ?? null,
    totalEarned: stats?.totalEarned ?? 0,
    bountiesCompleted: stats?.bountiesCompleted ?? 0,
  };
}

/**
 * Get bounty activity for any GitHub user (permissionless)
 *
 * Returns bounty data even if user hasn't signed up with GRIP.
 * Used for displaying GitHub profiles with overlay of GRIP activity.
 */
export async function getBountyDataByGitHubId(githubId: bigint | string) {
  const githubIdBigInt = typeof githubId === 'string' ? BigInt(githubId) : githubId;

  // Find user by GitHub ID via account table (may not exist in our DB)
  const [result] = await db
    .select({ user })
    .from(user)
    .innerJoin(account, eq(account.userId, user.id))
    .where(and(eq(account.providerId, 'github'), eq(account.accountId, githubIdBigInt.toString())))
    .limit(1);

  if (!result) {
    // User hasn't signed up yet - return empty activity
    return {
      completed: [],
      funded: [],
      totalEarned: 0,
      totalFunded: 0,
    };
  }

  const foundUser = result.user;

  // Compute stats from payouts (network-aware)
  const [stats] = await db
    .select({
      totalEarned: sql<number>`coalesce(sum(${payouts.amount}), 0)::bigint`,
    })
    .from(payouts)
    .where(
      and(
        chainIdFilter(payouts),
        eq(payouts.recipientUserId, foundUser.id),
        eq(payouts.status, 'confirmed')
      )
    );

  // Get completed bounties (bounties user received payouts for)
  const completed = await db
    .select({
      bountyId: bounties.id,
      title: bounties.title,
      amount: bounties.totalFunded,
      tokenAddress: bounties.tokenAddress,
      repoOwner: bounties.githubOwner,
      repoName: bounties.githubRepo,
      paidAt: bounties.paidAt,
    })
    .from(payouts)
    .innerJoin(bounties, eq(payouts.bountyId, bounties.id))
    .where(and(chainIdFilter(payouts), eq(payouts.recipientUserId, foundUser.id)));

  // Get funded bounties (bounties user is primary funder for)
  const funded = await db
    .select({
      id: bounties.id,
      title: bounties.title,
      amount: bounties.totalFunded,
      status: bounties.status,
      repoOwner: bounties.githubOwner,
      repoName: bounties.githubRepo,
      createdAt: bounties.createdAt,
    })
    .from(bounties)
    .where(and(chainIdFilter(bounties), eq(bounties.primaryFunderId, foundUser.id)));

  return {
    completed,
    funded,
    totalEarned: stats?.totalEarned ?? 0,
    totalFunded: funded.reduce((sum, b) => sum + Number(b.amount), 0),
  };
}

/**
 * Find GRIP user by GitHub username
 *
 * Used by webhooks to map GitHub PR authors to GRIP users.
 * Returns user ID if they've signed up, null otherwise.
 *
 * Note: user.name stores GitHub username from OAuth (set in lib/auth.ts)
 */
export async function findUserByGitHubUsername(githubUsername: string): Promise<string | null> {
  const [result] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.name, githubUsername))
    .limit(1);

  return result?.id ?? null;
}

/**
 * Get organizations a user belongs to (with visibility filtering)
 *
 * Returns organization memberships with essential display data.
 * Filters by visibility: only returns orgs that are public OR where viewer is also a member.
 * Used in user profile to show "Member of" section.
 */
export async function getUserOrganizations(userId: string, viewerId?: string | null) {
  const orgs = await db.query.member.findMany({
    where: eq(member.userId, userId),
    with: {
      organization: {
        columns: {
          id: true,
          name: true,
          logo: true,
          slug: true,
          githubOrgLogin: true,
          visibility: true,
        },
      },
    },
    orderBy: (member, { asc }) => [asc(member.createdAt)],
  });

  // If viewer is the profile owner, show all their orgs
  if (viewerId === userId) {
    return orgs;
  }

  // If no viewer (anonymous), only show public orgs
  if (!viewerId) {
    return orgs.filter((m) => m.organization.visibility === 'public');
  }

  // Get viewer's org memberships to check shared membership
  const viewerOrgs = await db.query.member.findMany({
    where: eq(member.userId, viewerId),
    columns: { organizationId: true },
  });
  const viewerOrgIds = new Set(viewerOrgs.map((m) => m.organizationId));

  // Show org if public OR viewer is also a member
  return orgs.filter(
    (m) => m.organization.visibility === 'public' || viewerOrgIds.has(m.organization.id)
  );
}
