import { getCompletedBountiesByUser } from '@/db/queries/bounties';
import { getSession } from '@/lib/auth/auth-server';
import { ActivityContributionsContent } from '../../_components/content/activity-contributions-content';

export default async function ContributionsPage() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const contributions = await getCompletedBountiesByUser(session.user.id);

  return <ActivityContributionsContent contributions={contributions} />;
}
