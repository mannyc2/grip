import { getUserOrganizations, getUserPendingInvitations } from '@/db/queries/users';
import { getSession } from '@/lib/auth/auth-server';
import { OrganizationsContent } from '../_components/content/organizations-content';

export default async function OrganizationsPage() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const [memberships, pendingInvitations] = await Promise.all([
    getUserOrganizations(session.user.id),
    getUserPendingInvitations(session.user.email),
  ]);

  return <OrganizationsContent memberships={memberships} pendingInvitations={pendingInvitations} />;
}
