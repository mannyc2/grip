import { getBountiesCreatedByUser } from '@/db/queries/bounties';
import { getSession } from '@/lib/auth/auth-server';
import { ActivityFundedContent } from '../../../../settings/_components/content/activity-funded-content';

export default async function FundedBountiesModal() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const bounties = await getBountiesCreatedByUser(session.user.id);

  return <ActivityFundedContent bounties={bounties} />;
}
