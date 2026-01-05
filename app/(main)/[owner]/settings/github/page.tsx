import { getOrgBySlug, getOrgMembership } from '@/db/queries/organizations';
import { getSession } from '@/lib/auth/auth-server';
import { notFound, redirect } from 'next/navigation';
import { GitHubContent } from '../_components/github-content';
import type { OrgRole } from '../_lib/types';

interface GitHubPageProps {
  params: Promise<{ owner: string }>;
}

/**
 * Organization settings - GitHub Sync page
 *
 * Route: /[org-slug]/settings/github
 *
 * Accessible to: owner only (and only if org has GitHub linked)
 */
export default async function GitHubPage({ params }: GitHubPageProps) {
  const { owner } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect(`/login?callbackUrl=/${owner}/settings/github`);
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

  // GitHub Sync requires org to have GitHub linked
  if (!org.githubOrgLogin) {
    redirect(`/${owner}/settings`);
  }

  return (
    <GitHubContent
      organizationId={org.id}
      githubOrgLogin={org.githubOrgLogin}
      lastSyncedAt={org.lastSyncedAt}
    />
  );
}
