import { getUserOrganizations, getUserPendingInvitations } from '@/db/queries/users';
import { getSession } from '@/lib/auth/auth-server';
import { OrganizationsContent } from '../../../settings/_components/content/organizations-content';

export default async function OrganizationsModal() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const [memberships, pendingInvitations] = await Promise.all([
    getUserOrganizations(session.user.id),
    getUserPendingInvitations(session.user.email),
  ]);

  return (
    <OrganizationsContent
      memberships={memberships}
      pendingInvitations={pendingInvitations}
      isModal
    />
  );
}
