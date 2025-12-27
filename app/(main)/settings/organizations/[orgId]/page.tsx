import { db } from '@/db';
import { organization } from '@/db/schema/auth';
import { getSession } from '@/lib/auth/auth-server';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { OrganizationDetailContent } from '../../_components/content/organization-detail-content';

export default async function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const org = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
  });

  if (!org) {
    notFound();
  }

  return (
    <OrganizationDetailContent
      organization={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        githubOrgLogin: org.githubOrgLogin,
      }}
    />
  );
}
