import { type NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-server';
import { auth } from '@/lib/auth/auth';
import { db, organization } from '@/db';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

type RouteContext = {
  params: Promise<{ orgId: string }>;
};

const VALID_VISIBILITY = ['public', 'private', 'members_only'] as const;
type OrgVisibility = (typeof VALID_VISIBILITY)[number];

/**
 * PUT /api/organizations/[orgId]/visibility
 *
 * Update organization visibility (owners only)
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireAuth();
    const { orgId } = await context.params;

    const headersList = await headers();
    const hasPermission = await auth.api.hasPermission({
      headers: headersList,
      body: { permissions: { organization: ['update'] }, organizationId: orgId },
    });
    if (!hasPermission?.success) {
      return NextResponse.json({ error: 'Only organization owners can update visibility' }, { status: 403 });
    }

    const body = await request.json();
    const { visibility } = body as { visibility: string };

    if (!visibility || !VALID_VISIBILITY.includes(visibility as OrgVisibility)) {
      return NextResponse.json(
        { error: `Invalid visibility. Must be one of: ${VALID_VISIBILITY.join(', ')}` },
        { status: 400 }
      );
    }

    await db
      .update(organization)
      .set({ visibility })
      .where(eq(organization.id, orgId));

    return NextResponse.json({ success: true, visibility });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating org visibility:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update visibility' },
      { status: 500 }
    );
  }
}
