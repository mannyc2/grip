import { getSession } from '@/lib/auth/auth-server';
import { getUserOrganizations } from '@/db/queries/users';

export type SettingsUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

export type SettingsOrganization = {
  id: string;
  name: string | null;
  logo: string | null;
  slug: string;
  role: string;
};

export type SettingsLayoutData = {
  user: SettingsUser;
  organizations: SettingsOrganization[];
};

/**
 * Fetches data required for the settings layout (sidebar).
 * Used by both full-page and modal layouts to avoid duplication.
 * Returns null if user is not authenticated.
 */
export async function getSettingsLayoutData(): Promise<SettingsLayoutData | null> {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const memberships = await getUserOrganizations(session.user.id);
  const organizations = memberships.map((m) => ({
    ...m.organization,
    role: m.role,
  }));

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
  };

  return { user, organizations };
}
