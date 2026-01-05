import { getOrgBySlug, getOrgMembership } from '@/db/queries/organizations';
import { getSession } from '@/lib/auth/auth-server';
import type { Organization, OrgRole, OrgSettingsContext } from './types';

export interface OrgSettingsLayoutData {
  organization: Organization;
  currentUserRole: OrgRole;
  context: OrgSettingsContext;
  userId: string;
}

/**
 * Fetches data required for org settings layout (sidebar + access control).
 * Returns null if user is not authenticated, org doesn't exist, or user is not a member.
 */
export async function getOrgSettingsLayoutData(
  ownerSlug: string
): Promise<OrgSettingsLayoutData | null> {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const org = await getOrgBySlug(ownerSlug);
  if (!org) {
    return null;
  }

  const membership = await getOrgMembership(org.id, session.user.id);
  if (!membership) {
    return null;
  }

  const currentUserRole = membership.role as OrgRole;
  const isOwner = currentUserRole === 'owner';
  const canViewWallet = isOwner || currentUserRole === 'billingAdmin';
  const canManageMembers = isOwner || currentUserRole === 'bountyManager';
  const hasGitHubSync = !!org.githubOrgLogin;

  const organization: Organization = {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo: org.logo,
    githubOrgLogin: org.githubOrgLogin,
    syncMembership: org.syncMembership,
    lastSyncedAt: org.lastSyncedAt,
    createdAt: org.createdAt,
  };

  return {
    organization,
    currentUserRole,
    userId: session.user.id,
    context: {
      organization,
      currentUserRole,
      isOwner,
      canViewWallet,
      canManageMembers,
      hasGitHubSync,
    },
  };
}
