import { getUserDashboardStats } from '@/db/queries/bounties';
import { getSession } from '@/lib/auth/auth-server';
import { ActivityContent } from '../_components/content/activity-content';

export default async function ActivityOverviewPage() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const stats = await getUserDashboardStats(session.user.id);

  return <ActivityContent stats={stats} />;
}
