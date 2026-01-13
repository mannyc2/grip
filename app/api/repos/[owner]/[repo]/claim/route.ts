import { requireAuth } from '@/lib/auth/auth-server';
import { fetchGitHubRepo, signClaimState, getSimpleInstallUrl } from '@/lib/github';
import { isOrgOwner } from '@/db/queries/organizations';
import { type NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ owner: string; repo: string }>;
}

interface ClaimRequestBody {
  organizationId?: string;
}

/**
 * POST /api/repos/[owner]/[repo]/claim
 *
 * Initiate the repo claiming flow by generating a signed state
 * and returning the GitHub App installation URL.
 *
 * Supports claiming for organization:
 * - Pass `organizationId` in body to claim for an org
 * - User must be org owner to claim for org
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { owner, repo } = await params;

    // Parse optional org context from body
    let organizationId: string | null = null;
    try {
      const body = (await request.json()) as ClaimRequestBody;
      organizationId = body.organizationId ?? null;
    } catch {
      // No body or invalid JSON - claim for personal account
    }

    // If claiming for org, verify user is org owner
    if (organizationId) {
      const isOwner = await isOrgOwner(organizationId, session.user.id);
      if (!isOwner) {
        return NextResponse.json(
          { error: 'Only organization owners can claim repos for the organization' },
          { status: 403 }
        );
      }
    }

    // Verify repo exists on GitHub
    const githubRepo = await fetchGitHubRepo(owner, repo);
    if (!githubRepo) {
      return NextResponse.json({ error: 'Repository not found on GitHub' }, { status: 404 });
    }

    // Only allow claiming public repos
    if (githubRepo.private) {
      return NextResponse.json({ error: 'Cannot claim private repositories' }, { status: 400 });
    }

    // Include callbackUrl in state if not production (enables dev proxy)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const isProduction = appUrl.includes('usegrip.xyz');
    const callbackUrl = !isProduction ? `${appUrl}/api/github/callback` : undefined;

    // Generate signed state for the installation callback (with optional org context)
    const state = signClaimState({
      userId: session.user.id,
      organizationId,
      owner: githubRepo.owner.login,
      repo: githubRepo.name,
      timestamp: Date.now(),
      callbackUrl,
    });

    // Build the GitHub App installation URL
    const installUrl = getSimpleInstallUrl(state);

    return NextResponse.json({ installUrl });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[claim] Error initiating claim:', error);
    return NextResponse.json({ error: 'Failed to initiate claim' }, { status: 500 });
  }
}
