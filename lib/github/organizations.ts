import { githubFetch, githubFetchWithToken } from './index';

/**
 * GitHub Organization API Utilities
 *
 * Provides functions for:
 * - Listing user's GitHub organizations
 * - Checking user's org membership and role
 * - Fetching org members (with pagination)
 *
 * Follows existing GitHub API patterns:
 * - githubFetch(): Server token for public data
 * - githubFetchWithToken(): User OAuth token for authenticated operations
 *
 * Rate limits: 5000 requests/hour (authenticated)
 */

// ============ Types ============

export interface GitHubOrganization {
  id: number;
  login: string; // GitHub org username (e.g., "anthropics")
  avatar_url: string;
  description: string | null;
  name: string | null; // Display name (optional)
}

export interface GitHubOrgMembership {
  state: 'active' | 'pending';
  role: 'admin' | 'member';
}

export interface GitHubMember {
  id: number;
  login: string;
  avatar_url: string;
}

// ============ Public Data (Server Token) ============

/**
 * Get public organization info
 *
 * Endpoint: GET /orgs/{org}
 * Auth: Server token (GITHUB_TOKEN)
 *
 * Returns: Organization details or null if not found
 *
 * Example:
 *   const org = await getOrganization('anthropics');
 *   console.log(org?.name); // "Anthropic"
 */
export async function getOrganization(orgLogin: string): Promise<GitHubOrganization | null> {
  return githubFetch<GitHubOrganization>(`/orgs/${orgLogin}`);
}

// ============ Authenticated (User Token) ============

/**
 * List user's organizations
 *
 * Endpoint: GET /user/orgs
 * Auth: User OAuth token
 * Scope required: read:org
 *
 * Returns: Array of organizations user belongs to (empty array on error)
 *
 * Example:
 *   const token = await getGitHubToken(userId);
 *   const orgs = await getUserOrganizations(token);
 *   // [{ id: 123, login: "my-org", ... }]
 */
export async function getUserOrganizations(token: string): Promise<GitHubOrganization[]> {
  const res = await githubFetchWithToken(token, '/user/orgs');

  if (!res.ok) {
    if (res.status === 403) {
      // User needs to grant read:org scope - handled by UI re-auth flow
      console.info('GitHub organizations: read:org scope required');
      throw new Error('GitHub API error: 403');
    }
    console.error(`Failed to fetch user orgs: ${res.status}`);
    return [];
  }

  return res.json();
}

/**
 * Check user's membership in an organization
 *
 * Endpoint: GET /user/memberships/orgs/{org}
 * Auth: User OAuth token
 * Scope required: read:org
 *
 * Returns: Membership details or null if user is not a member
 *
 * Use case: Verify user is admin of GitHub org before allowing link
 *
 * Example:
 *   const membership = await getUserOrgMembership(token, 'anthropics');
 *   if (membership?.role === 'admin') {
 *     // User can link this org
 *   }
 */
export async function getUserOrgMembership(
  token: string,
  orgLogin: string
): Promise<GitHubOrgMembership | null> {
  const res = await githubFetchWithToken(token, `/user/memberships/orgs/${orgLogin}`);

  if (res.status === 404) return null; // Not a member
  if (!res.ok) {
    console.error(`Failed to check org membership: ${res.status}`);
    throw new Error(`Failed to check org membership: ${res.status}`);
  }

  return res.json();
}

/**
 * List organization members (single page)
 *
 * Endpoint: GET /orgs/{org}/members
 * Auth: User OAuth token
 * Scope required: read:org (or org admin)
 *
 * Supports role filtering:
 * - 'all' (default): All members
 * - 'admin': Only organization admins
 * - 'member': Only regular members
 *
 * Returns: Array of members (up to perPage limit)
 *
 * Note: GitHub API paginates results. Use getAllOrgMembers() for all members.
 *
 * Example:
 *   const members = await getOrgMembers(token, 'anthropics', 1, 100);
 *   const admins = await getOrgMembers(token, 'anthropics', 1, 100, 'admin');
 */
export async function getOrgMembers(
  token: string,
  orgLogin: string,
  page = 1,
  perPage = 100,
  role: 'admin' | 'member' | 'all' = 'all'
): Promise<GitHubMember[]> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  // Add role filter if not 'all'
  if (role !== 'all') {
    params.set('role', role);
  }

  const res = await githubFetchWithToken(token, `/orgs/${orgLogin}/members?${params}`);

  if (!res.ok) {
    console.error(`Failed to fetch org members: ${res.status} ${res.statusText}`);
    return [];
  }

  return res.json();
}

/**
 * Get all organization members (handles pagination)
 *
 * Auth: User OAuth token
 * Scope required: read:org (or org admin)
 *
 * Supports role filtering:
 * - 'all' (default): All members
 * - 'admin': Only organization admins
 * - 'member': Only regular members
 *
 * Returns: Array of all members across all pages
 *
 * Use case: Full membership sync for GitHub-linked organizations
 *
 * Note: Can be slow for large orgs (100 members per request)
 * Consider caching results to avoid hitting rate limits
 *
 * Example:
 *   const allMembers = await getAllOrgMembers(token, 'anthropics');
 *   const admins = await getAllOrgMembers(token, 'anthropics', 'admin');
 */
export async function getAllOrgMembers(
  token: string,
  orgLogin: string,
  role: 'admin' | 'member' | 'all' = 'all'
): Promise<GitHubMember[]> {
  const members: GitHubMember[] = [];
  let page = 1;

  while (true) {
    const batch = await getOrgMembers(token, orgLogin, page, 100, role);

    if (batch.length === 0) break; // No more members

    members.push(...batch);

    if (batch.length < 100) break; // Last page (fewer than 100 members)

    page++;
  }

  return members;
}

/**
 * Get all organization members with role information
 *
 * Fetches both all members and admins in parallel using batch role filtering.
 * This is 50x more efficient than checking each member's role individually.
 *
 * Auth: User OAuth token
 * Scope required: read:org (or org admin)
 *
 * Returns: Object with admins array and allMembers array
 *
 * Use case: GitHub org sync - determine member roles efficiently
 *
 * API calls: ~(N/100)*2 for N members (vs N API calls for individual checks)
 * Example: 500 members = 10 API calls (vs 500 individual role checks)
 *
 * Example:
 *   const { admins, allMembers } = await getAllOrgMembersByRole(token, 'anthropics');
 *   const adminIds = new Set(admins.map(m => m.id));
 *   const isAdmin = adminIds.has(memberId); // O(1) lookup
 */
export async function getAllOrgMembersByRole(
  token: string,
  orgLogin: string
): Promise<{ admins: GitHubMember[]; allMembers: GitHubMember[] }> {
  // Fetch admins and all members in parallel
  // GitHub API supports ?role=admin filter to get only admins
  const [admins, allMembers] = await Promise.all([
    getAllOrgMembers(token, orgLogin, 'admin'),
    getAllOrgMembers(token, orgLogin, 'all'),
  ]);

  return { admins, allMembers };
}
