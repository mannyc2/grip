import { auth } from '@/lib/auth/auth';
import { requireAuth } from '@/lib/auth/auth-server';
import { getGitHubToken } from '@/lib/github';
import { syncGitHubMembers } from '@/lib/organization/sync';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/organizations/sync
 *
 * Manually trigger GitHub membership sync for an organization
 *
 * Request body:
 * - organizationId: string (required)
 *
 * Response:
 * - success: boolean
 * - added: number (members added)
 * - removed: number (members removed)
 * - errors: string[] (any errors during sync)
 *
 * Requires:
 * - User must be authenticated
 * - User must have 'organization:update' permission (owner or admin)
 * - User must have GitHub account connected
 * - Organization must be configured for GitHub sync
 *
 * Example usage:
 *   const res = await fetch('/api/organizations/sync', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ organizationId: 'org-123' }),
 *   });
 *   const result = await res.json();
 *   console.log(`Added ${result.added}, removed ${result.removed}`);
 */
export async function POST(req: NextRequest) {
  // 1. Verify authentication
  const session = await requireAuth();

  // 2. Parse request body
  const body = await req.json();
  const { organizationId } = body;

  if (!organizationId || typeof organizationId !== 'string') {
    return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
  }

  // 3. Check user has permission to sync (owner or admin only)
  // Organization update permission is required to trigger sync
  try {
    const hasPermission = await auth.api.hasPermission({
      headers: req.headers,
      body: {
        permissions: {
          organization: ['update'],
        },
      },
    });

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only organization owners and admins can sync.' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Permission check failed:', error);
    return NextResponse.json({ error: 'Permission check failed' }, { status: 500 });
  }

  // 4. Get user's GitHub token
  const token = await getGitHubToken(session.user.id);
  if (!token) {
    return NextResponse.json(
      {
        error:
          'GitHub account not connected. Please connect your GitHub account to sync organization members.',
      },
      { status: 400 }
    );
  }

  // 5. Perform sync
  try {
    const result = await syncGitHubMembers(organizationId, token);

    return NextResponse.json({
      success: true,
      added: result.added,
      removed: result.removed,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Sync failed:', error);

    // Return user-friendly error message
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred during sync';

    return NextResponse.json(
      {
        error: 'Sync failed',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
