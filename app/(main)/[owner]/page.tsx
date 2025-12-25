import { getBountyDataByGitHubId, getUserByName } from '@/db/queries/users';
import {
  getOrgByGithubLogin,
  getOrgBountyData,
  getOrgMembersWithUsers,
} from '@/db/queries/organizations';
import { getSession } from '@/lib/auth/auth-server';
import {
  fetchGitHubUser,
  fetchGitHubUserActivity,
  fetchGitHubOrgRepositories,
} from '@/lib/github/api';
import { getOrganization } from '@/lib/github/organizations';
import { notFound } from 'next/navigation';
import { UserProfile } from './_components/user-profile';
import { OrgProfile } from './_components/org-profile';

interface OwnerPageProps {
  params: Promise<{ owner: string }>;
}

// Reserved routes that should not be treated as owner names
const RESERVED_ROUTES = new Set([
  'explore',
  'wallet',
  'settings',
  'notifications',
  'login',
  'claim',
  'tx',
  'api',
  'bounties',
]);

/**
 * Unified owner profile page - handles both GitHub users and organizations
 *
 * PERMISSIONLESS: Works for ANY GitHub user or org, whether they've signed up or not.
 * Fetches from GitHub API first, then overlays GRIP data if available.
 *
 * Owner type detection:
 * 1. Try GitHub user first (most common)
 * 2. Try GitHub organization if user not found
 * 3. Return 404 if neither exists
 */
export default async function OwnerPage({ params }: OwnerPageProps) {
  const { owner } = await params;
  const session = await getSession();

  // Check reserved routes first
  if (RESERVED_ROUTES.has(owner)) {
    notFound();
  }

  // Try user first (most common case)
  const [githubUser, githubActivity] = await Promise.all([
    fetchGitHubUser(owner),
    fetchGitHubUserActivity(owner),
  ]);

  if (githubUser) {
    // It's a user - render user profile
    const bountyLaneUser = await getUserByName(owner);
    const bountyData = await getBountyDataByGitHubId(BigInt(githubUser.id));
    const isOwnProfile = session?.user?.name === owner;
    const isLoggedIn = !!session?.user;

    return (
      <UserProfile
        github={githubUser}
        githubActivity={githubActivity}
        bountyLaneUser={bountyLaneUser}
        bountyData={bountyData}
        isOwnProfile={isOwnProfile}
        isLoggedIn={isLoggedIn}
      />
    );
  }

  // Try organization
  const githubOrg = await getOrganization(owner);

  if (githubOrg) {
    // It's an organization - render org profile
    const [gripOrg, repos] = await Promise.all([
      getOrgByGithubLogin(owner),
      fetchGitHubOrgRepositories(owner),
    ]);

    // Get bounty data only if org is linked to GRIP
    const orgBountyData = gripOrg ? await getOrgBountyData(gripOrg.id) : null;
    const orgMembers = gripOrg ? await getOrgMembersWithUsers(gripOrg.id) : null;

    const isLoggedIn = !!session?.user;

    return (
      <OrgProfile
        github={githubOrg}
        repos={repos}
        gripOrg={gripOrg ?? null}
        bountyData={orgBountyData}
        members={orgMembers}
        isLoggedIn={isLoggedIn}
      />
    );
  }

  // Neither user nor org exists
  notFound();
}
