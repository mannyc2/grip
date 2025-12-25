import { type NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-server';
import { revokeAccessKey } from '@/lib/tempo/access-keys';
import { isOrgOwner } from '@/db/queries/organizations';
import { getOrgAccessKeyById } from '@/db/queries/access-keys';

type RouteContext = {
  params: Promise<{ orgId: string; keyId: string }>;
};

/**
 * DELETE /api/organizations/[orgId]/access-keys/[keyId]
 *
 * Revoke organization Access Key (owner only)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { orgId, keyId } = await context.params;

    if (!(await isOrgOwner(orgId, session.user.id))) {
      return NextResponse.json(
        { error: 'Only organization owner can revoke Access Keys' },
        { status: 403 }
      );
    }

    const accessKey = await getOrgAccessKeyById(keyId, orgId);
    if (!accessKey) {
      return NextResponse.json({ error: 'Access Key not found' }, { status: 404 });
    }

    await revokeAccessKey(keyId, 'Revoked by owner');
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error revoking org access key:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to revoke access key' },
      { status: 500 }
    );
  }
}
