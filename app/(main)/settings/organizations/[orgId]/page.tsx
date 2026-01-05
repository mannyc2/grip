import { db } from '@/db';
import { organization } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';

/**
 * Legacy organization settings route - redirects to new location
 *
 * Old: /settings/organizations/[orgId]
 * New: /[org-slug]/settings
 *
 * This redirect ensures old bookmarks and links continue to work.
 */
export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  // Look up org to get slug for redirect
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
    columns: { slug: true },
  });

  if (!org) {
    notFound();
  }

  // Redirect to new location
  redirect(`/${org.slug}/settings`);
}
