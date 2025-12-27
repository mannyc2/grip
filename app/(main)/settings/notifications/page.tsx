import { getSession } from '@/lib/auth/auth-server';
import { getOrCreateNotificationPreferences } from '@/db/queries/notification-preferences';
import { redirect } from 'next/navigation';
import { NotificationsContent } from '../_components/content/notifications-content';

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const preferences = await getOrCreateNotificationPreferences(session.user.id);

  return <NotificationsContent preferences={preferences} />;
}
