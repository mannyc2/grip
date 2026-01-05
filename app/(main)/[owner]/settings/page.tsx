import { getOrgBySlug, getOrgMembership } from '@/db/queries/organizations';
import { getSession } from '@/lib/auth/auth-server';
import { notFound, redirect } from 'next/navigation';
import { GeneralContent } from './_components/general-content';

interface OrgSettingsPageProps {
  params: Promise<{ owner: string }>;
}

/**
 * Organization settings - General page
 *
 * Route: /[org-slug]/settings
 *
 * Displays organization details and danger zone.
 * Accessible to all org members.
 */
export default async function OrgSettingsPage({ params }: OrgSettingsPageProps) {
  const { owner } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect(`/login?callbackUrl=/${owner}/settings`);
  }

  const org = await getOrgBySlug(owner);
  if (!org) {
    notFound();
  }

  const membership = await getOrgMembership(org.id, session.user.id);
  if (!membership) {
    return (
      <div className="py-8 text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You are not a member of this organization.</p>
      </div>
    );
  }

  const isOwner = membership.role === 'owner';

  return (
    <GeneralContent
      organization={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        githubOrgLogin: org.githubOrgLogin,
        createdAt: org.createdAt,
      }}
      isOwner={isOwner}
    />
  );
}
