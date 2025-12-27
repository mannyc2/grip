import { getUserDashboardStats } from '@/db/queries/bounties';
import { getSession } from '@/lib/auth/auth-server';
import { ActivityContent } from '../../../settings/_components/content/activity-content';

export default async function ActivityOverviewModal() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const stats = await getUserDashboardStats(session.user.id);

  return <ActivityContent stats={stats} />;
}
