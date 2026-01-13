import { bounties, db, repoSettings } from '@/db';
import { and, desc, eq, sql } from 'drizzle-orm';
import { isOrgOwner } from './organizations';

// Owner types for XOR pattern (user OR org, never both)
export type RepoOwner =
  | { type: 'user'; userId: string }
  | { type: 'organization'; organizationId: string }
  | { type: 'unclaimed' };

export type CreateRepoSettingsInput = {
  githubRepoId: bigint | string;
  githubOwner: string;
  githubRepo: string;
  installationId?: bigint | string;
  // XOR: provide one or the other, not both
  verifiedOwnerUserId?: string;
  verifiedOwnerOrganizationId?: string;
};

/**
 * Create repo settings (repo owner verification)
 *
 * Verified repo owners (user OR org) can create settings.
 * XOR constraint enforced at DB level: exactly one owner type can be set.
 */
export async function createRepoSettings(input: CreateRepoSettingsInput) {
  const githubRepoId =
    typeof input.githubRepoId === 'string' ? BigInt(input.githubRepoId) : input.githubRepoId;

  const installationId = input.installationId
    ? typeof input.installationId === 'string'
      ? BigInt(input.installationId)
      : input.installationId
    : null;

  const [settings] = await db
    .insert(repoSettings)
    .values({
      githubRepoId,
      githubOwner: input.githubOwner,
      githubRepo: input.githubRepo,
      verifiedOwnerUserId: input.verifiedOwnerUserId ?? null,
      verifiedOwnerOrganizationId: input.verifiedOwnerOrganizationId ?? null,
      verifiedAt: new Date().toISOString(),
      installationId,
    })
    .returning();

  return settings;
}

/**
 * Get repo settings by GitHub repo ID (primary key)
 */
export async function getRepoSettingsByGithubRepoId(githubRepoId: bigint | string) {
  const repoIdBigInt = typeof githubRepoId === 'string' ? BigInt(githubRepoId) : githubRepoId;

  const [settings] = await db
    .select()
    .from(repoSettings)
    .where(eq(repoSettings.githubRepoId, repoIdBigInt))
    .limit(1);

  return settings ?? null;
}

/**
 * Get repo settings by owner/repo name
 */
export async function getRepoSettingsByName(owner: string, repo: string) {
  const [settings] = await db
    .select()
    .from(repoSettings)
    .where(and(eq(repoSettings.githubOwner, owner), eq(repoSettings.githubRepo, repo)))
    .limit(1);

  return settings ?? null;
}

/**
 * Get all repos owned by user (verified owner)
 */
export async function getRepoSettingsByUser(userId: string) {
  return db.select().from(repoSettings).where(eq(repoSettings.verifiedOwnerUserId, userId));
}

export type RepoSettingsUpdate = Partial<{
  autoPayEnabled: boolean;
  requireOwnerApproval: boolean;
  defaultExpirationDays: number | null;
  contributorEligibility: 'anyone' | 'collaborators';
  showAmountsPublicly: boolean;
  emailOnSubmission: boolean;
  emailOnMerge: boolean;
  emailOnPaymentFailure: boolean;
  onboardingCompleted: boolean;
}>;

/**
 * Update repo settings (batch update for all configurable fields)
 *
 * Used by settings page to update multiple fields at once.
 */
export async function updateRepoSettings(
  githubRepoId: bigint | string,
  updates: RepoSettingsUpdate
) {
  const repoIdBigInt = typeof githubRepoId === 'string' ? BigInt(githubRepoId) : githubRepoId;

  const [updated] = await db
    .update(repoSettings)
    .set(updates)
    .where(eq(repoSettings.githubRepoId, repoIdBigInt))
    .returning();

  return updated;
}

/**
 * Check if user is verified owner of repo
 *
 * Used for permission checks in settings pages and approval flows.
 * @deprecated Use canManageRepo() for org-aware permission checks
 */
export async function isUserRepoOwner(
  githubRepoId: bigint | string,
  userId: string
): Promise<boolean> {
  const settings = await getRepoSettingsByGithubRepoId(githubRepoId);
  return settings?.verifiedOwnerUserId === userId;
}

/**
 * Check if user can manage a repository's settings
 *
 * Returns true if:
 * - User directly owns the repo (verifiedOwnerUserId), OR
 * - User is owner of the org that owns the repo (verifiedOwnerOrganizationId)
 */
export async function canManageRepo(
  githubRepoId: bigint | string,
  userId: string
): Promise<boolean> {
  const settings = await getRepoSettingsByGithubRepoId(githubRepoId);
  if (!settings) return false;

  // Direct user ownership
  if (settings.verifiedOwnerUserId === userId) {
    return true;
  }

  // Organization ownership - check if user is org owner
  if (settings.verifiedOwnerOrganizationId) {
    return await isOrgOwner(settings.verifiedOwnerOrganizationId, userId);
  }

  return false;
}

/**
 * Get the owner identity for a repo
 *
 * Returns discriminated union: user | organization | unclaimed
 */
export async function getRepoOwner(githubRepoId: bigint | string): Promise<RepoOwner> {
  const settings = await getRepoSettingsByGithubRepoId(githubRepoId);

  if (!settings) {
    return { type: 'unclaimed' };
  }

  if (settings.verifiedOwnerUserId) {
    return { type: 'user', userId: settings.verifiedOwnerUserId };
  }

  if (settings.verifiedOwnerOrganizationId) {
    return { type: 'organization', organizationId: settings.verifiedOwnerOrganizationId };
  }

  return { type: 'unclaimed' };
}

/**
 * Get all repos owned by an organization (proper FK query)
 *
 * Replaces string matching on githubOwner with proper FK relationship.
 */
export async function getOrgOwnedRepos(orgId: string) {
  return db
    .select()
    .from(repoSettings)
    .where(eq(repoSettings.verifiedOwnerOrganizationId, orgId));
}

/**
 * Get total count of repo settings (verified repos)
 *
 * Used for homepage stats display.
 */
export async function getRepoSettingsCount(): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` }).from(repoSettings);

  return result[0]?.count ?? 0;
}

/**
 * Unclaim all repos by installation ID
 *
 * Called when GitHub App is uninstalled. Nulls out verification fields
 * but keeps the repo_settings record for historical bounty associations.
 */
export async function unclaimReposByInstallationId(installationId: bigint | string) {
  const installationIdBigInt =
    typeof installationId === 'string' ? BigInt(installationId) : installationId;

  const updated = await db
    .update(repoSettings)
    .set({
      verifiedOwnerUserId: null,
      verifiedOwnerOrganizationId: null,
      installationId: null,
      verifiedAt: null,
      autoPayAccessKeyId: null,
    })
    .where(eq(repoSettings.installationId, installationIdBigInt))
    .returning();

  return updated;
}

/**
 * Unclaim a single repo by GitHub repo ID
 *
 * Called when a repo is removed from a GitHub App installation.
 * Nulls out verification fields but keeps the record.
 */
export async function unclaimRepoByGithubRepoId(githubRepoId: bigint | string) {
  const repoIdBigInt = typeof githubRepoId === 'string' ? BigInt(githubRepoId) : githubRepoId;

  const [updated] = await db
    .update(repoSettings)
    .set({
      verifiedOwnerUserId: null,
      verifiedOwnerOrganizationId: null,
      installationId: null,
      verifiedAt: null,
      autoPayAccessKeyId: null,
    })
    .where(eq(repoSettings.githubRepoId, repoIdBigInt))
    .returning();

  return updated ?? null;
}

export type UpdateRepoInstallationOwner =
  | { type: 'user'; userId: string }
  | { type: 'organization'; organizationId: string };

/**
 * Update repo settings with installation ID and verified owner
 *
 * Used when claiming a repo via GitHub App installation.
 * Supports both user and org ownership (XOR pattern).
 */
export async function updateRepoInstallation(
  githubRepoId: bigint | string,
  installationId: bigint | string,
  owner: UpdateRepoInstallationOwner
) {
  const repoIdBigInt = typeof githubRepoId === 'string' ? BigInt(githubRepoId) : githubRepoId;
  const installationIdBigInt =
    typeof installationId === 'string' ? BigInt(installationId) : installationId;

  const ownerFields =
    owner.type === 'user'
      ? { verifiedOwnerUserId: owner.userId, verifiedOwnerOrganizationId: null }
      : { verifiedOwnerUserId: null, verifiedOwnerOrganizationId: owner.organizationId };

  const [updated] = await db
    .update(repoSettings)
    .set({
      installationId: installationIdBigInt,
      ...ownerFields,
      verifiedAt: new Date().toISOString(),
    })
    .where(eq(repoSettings.githubRepoId, repoIdBigInt))
    .returning();

  return updated ?? null;
}

/**
 * Transfer repo ownership between user and org
 *
 * Clears the previous owner and sets the new one.
 * Also clears autoPayAccessKeyId to force reconfiguration.
 */
export async function transferRepoOwnership(
  githubRepoId: bigint | string,
  newOwner: UpdateRepoInstallationOwner
) {
  const repoIdBigInt = typeof githubRepoId === 'string' ? BigInt(githubRepoId) : githubRepoId;

  const ownerFields =
    newOwner.type === 'user'
      ? { verifiedOwnerUserId: newOwner.userId, verifiedOwnerOrganizationId: null }
      : { verifiedOwnerUserId: null, verifiedOwnerOrganizationId: newOwner.organizationId };

  const [updated] = await db
    .update(repoSettings)
    .set({
      ...ownerFields,
      autoPayAccessKeyId: null,
      verifiedAt: new Date().toISOString(),
    })
    .where(eq(repoSettings.githubRepoId, repoIdBigInt))
    .returning();

  return updated ?? null;
}
