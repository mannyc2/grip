import { getSession } from '@/lib/auth/auth-server';
import { ProfileContent } from './_components/content/profile-content';

export default async function SettingsProfilePage() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  return (
    <ProfileContent
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
    />
  );
}
