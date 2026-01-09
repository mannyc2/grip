import { getActiveAccessKey } from '@/db/queries/access-keys';
import {
  getOrgBySlug,
  getOrgMembership,
  getOrgMembersWithUsers,
  getOrgAccessKeys,
} from '@/db/queries/organizations';
import { getPasskeysByUser } from '@/db/queries/passkeys';
import { getSession } from '@/lib/auth/auth-server';
import { notFound, redirect } from 'next/navigation';
import { AccessKeysContent } from '../_components/access-keys-content';
import type { OrgRole } from '../_lib/types';

interface AccessKeysPageProps {
  params: Promise<{ owner: string }>;
}

/**
 * Organization settings - Access Keys page
 *
 * Route: /[org-slug]/settings/access-keys
 *
 * Accessible to: owner only
 */
export default async function AccessKeysPage({ params }: AccessKeysPageProps) {
  const { owner } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect(`/login?callbackUrl=/${owner}/settings/access-keys`);
  }

  const org = await getOrgBySlug(owner);
  if (!org) {
    notFound();
  }

  const membership = await getOrgMembership(org.id, session.user.id);
  if (!membership) {
    notFound();
  }

  const currentUserRole = membership.role as OrgRole;
  if (currentUserRole !== 'owner') {
    redirect(`/${owner}/settings`);
  }

  const [ownerAccessKey, orgAccessKeys, members, passkeys] = await Promise.all([
    getActiveAccessKey(session.user.id),
    getOrgAccessKeys(org.id),
    getOrgMembersWithUsers(org.id),
    getPasskeysByUser(session.user.id),
  ]);

  const walletPasskey = passkeys.find((p) => p.wallet?.address) ?? null;

  return (
    <AccessKeysContent
      ownerHasAccessKey={!!ownerAccessKey}
      orgAccessKeys={orgAccessKeys ?? []}
      members={members}
      organizationId={org.id}
      walletAddress={(walletPasskey?.wallet?.address ?? null) as `0x${string}` | null}
    />
  );
}
