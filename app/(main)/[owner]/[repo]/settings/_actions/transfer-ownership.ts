'use server';

import {
  canManageRepo,
  getRepoSettingsByGithubRepoId,
  transferRepoOwnership as transferOwnershipDb,
  type UpdateRepoInstallationOwner,
} from '@/db/queries/repo-settings';
import { isOrgOwner } from '@/db/queries/organizations';
import { requireAuth } from '@/lib/auth/auth-server';
import { db } from '@/db';
import { user } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';

export type TransferResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Transfer repo ownership to a user or organization
 *
 * Requirements:
 * - Current user must be able to manage the repo (owner or org owner)
 * - If transferring to org: user must be owner of that org
 * - If transferring to user: target user must exist
 */
export async function transferRepoOwnership(
  githubRepoId: string,
  targetType: 'user' | 'organization',
  targetId: string
): Promise<TransferResult> {
  try {
    const session = await requireAuth();

    const repoIdBigInt = BigInt(githubRepoId);

    // Get current repo settings
    const settings = await getRepoSettingsByGithubRepoId(repoIdBigInt);
    if (!settings) {
      return { success: false, error: 'Repository not found' };
    }

    // Verify current user can manage this repo
    const canManage = await canManageRepo(repoIdBigInt, session.user.id);
    if (!canManage) {
      return { success: false, error: 'You do not have permission to transfer this repository' };
    }

    // Validate target based on type
    let newOwner: UpdateRepoInstallationOwner;

    if (targetType === 'organization') {
      // User must be owner of target org
      const isTargetOrgOwner = await isOrgOwner(targetId, session.user.id);
      if (!isTargetOrgOwner) {
        return {
          success: false,
          error: 'You must be an owner of the organization to transfer to it',
        };
      }
      newOwner = { type: 'organization', organizationId: targetId };
    } else {
      // Target user must exist
      const targetUser = await db.query.user.findFirst({
        where: eq(user.id, targetId),
      });
      if (!targetUser) {
        return { success: false, error: 'Target user not found' };
      }
      // Only allow transfer to self for user->user transfers
      if (targetId !== session.user.id) {
        return {
          success: false,
          error: 'Can only transfer to yourself. For other users, they must claim the repo.',
        };
      }
      newOwner = { type: 'user', userId: targetId };
    }

    // Perform the transfer
    const updated = await transferOwnershipDb(repoIdBigInt, newOwner);
    if (!updated) {
      return { success: false, error: 'Failed to transfer ownership' };
    }

    return { success: true };
  } catch (error) {
    console.error('[transfer-ownership] Error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'You must be logged in to transfer ownership' };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}
