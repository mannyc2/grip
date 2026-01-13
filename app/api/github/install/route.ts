import { requireAuth } from '@/lib/auth/auth-server';
import { signClaimState, getSimpleInstallUrl } from '@/lib/github';
import { isOrgOwner } from '@/db/queries/organizations';
import { type NextRequest, NextResponse } from 'next/server';

interface InstallRequestBody {
  organizationId?: string;
}

/**
 * POST /api/github/install
 *
 * Get the GitHub App installation URL for adding new repos.
 * Unlike /api/repos/[owner]/[repo]/claim, this doesn't target a specific repo.
 *
 * Supports claiming for organization:
 * - Pass `organizationId` in body to claim for an org
 * - User must be org owner to claim for org
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Parse optional org context from body
    let organizationId: string | null = null;
    try {
      const body = (await request.json()) as InstallRequestBody;
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

    // Include callbackUrl in state if not production (enables dev proxy)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const isProduction = appUrl.includes('usegrip.xyz');
    const callbackUrl = !isProduction ? `${appUrl}/api/github/callback` : undefined;

    // Generate signed state (with optional org context)
    const state = signClaimState({
      userId: session.user.id,
      organizationId,
      owner: '',
      repo: '',
      timestamp: Date.now(),
      callbackUrl,
    });

    const installUrl = getSimpleInstallUrl(state);

    return NextResponse.json({ installUrl });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[github/install] Error:', error);
    return NextResponse.json({ error: 'Failed to get install URL' }, { status: 500 });
  }
}
