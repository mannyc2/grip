import { type NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/auth-server';
import { getOrgWalletAddress, isOrgMember } from '@/db/queries/organizations';
import { tempoClient } from '@/lib/tempo/client';
import { TEMPO_TOKENS } from '@/lib/tempo/constants';
import { getCurrentNetwork } from '@/db/network';

type RouteContext = {
  params: Promise<{ orgId: string }>;
};

/**
 * GET /api/organizations/[orgId]/wallet
 *
 * Get organization wallet address and balance (members can view)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth();
    const { orgId } = await context.params;

    if (!(await isOrgMember(orgId, session.user.id))) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    const address = await getOrgWalletAddress(orgId);

    const balance = await tempoClient.token.getBalance({
      account: address,
      token: TEMPO_TOKENS.PATH_USD,
    });

    return NextResponse.json({
      address,
      balance: balance.toString(),
      network: getCurrentNetwork(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error getting org wallet:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get wallet' },
      { status: 500 }
    );
  }
}
