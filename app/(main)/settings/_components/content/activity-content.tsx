import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatUnits } from 'viem';

function formatUSDC(amount: string): string {
  const formatted = formatUnits(BigInt(amount), 6);
  return `$${Number(formatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface ActivityStats {
  earned: { total: string; count: number };
  pending: { total: string; count: number };
  created: { total: string; count: number };
  claimed: { count: number };
}

export interface ActivityContentProps {
  stats: ActivityStats;
}

export function ActivityContent({ stats }: ActivityContentProps) {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Overview</h1>
        <p className="text-muted-foreground">Summary of your bounty activity on GRIP</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Earned"
          value={formatUSDC(stats.earned.total)}
          info={`${stats.earned.count} bounties completed`}
        />
        <StatCard
          label="Pending Payouts"
          value={formatUSDC(stats.pending.total)}
          info={`${stats.pending.count} awaiting payment`}
        />
        <StatCard
          label="Bounties Created"
          value={formatUSDC(stats.created.total)}
          info={`${stats.created.count} bounties funded`}
        />
        <StatCard
          label="Bounties Claimed"
          value={stats.claimed.count.toString()}
          info="Total submissions made"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funded Bounties</CardTitle>
            <CardDescription>Bounties you have created and funded</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/settings/activity/funded"
              className="flex items-center text-sm text-primary hover:underline"
            >
              View all funded bounties
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contributions</CardTitle>
            <CardDescription>Bounties you have completed</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/settings/activity/contributions"
              className="flex items-center text-sm text-primary hover:underline"
            >
              View all contributions
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
