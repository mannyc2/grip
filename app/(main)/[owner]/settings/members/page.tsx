import { getOrgBySlug, getOrgMembership, getOrgMembersWithUsers } from '@/db/queries/organizations';
import { getSession } from '@/lib/auth/auth-server';
import { notFound, redirect } from 'next/navigation';
import { MembersContent } from '../_components/members-content';
import type { OrgRole } from '../_lib/types';

interface MembersPageProps {
  params: Promise<{ owner: string }>;
}

/**
 * Organization settings - Members page
 *
 * Route: /[org-slug]/settings/members
 *
 * Accessible to: owner, bountyManager
 */
export default async function MembersPage({ params }: MembersPageProps) {
  const { owner } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect(`/login?callbackUrl=/${owner}/settings/members`);
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
  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'bountyManager';

  if (!canManageMembers) {
    redirect(`/${owner}/settings`);
  }

  const members = await getOrgMembersWithUsers(org.id);

  return (
    <MembersContent members={members} organizationId={org.id} currentUserRole={currentUserRole} />
  );
}
