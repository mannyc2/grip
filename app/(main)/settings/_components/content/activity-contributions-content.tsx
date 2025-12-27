import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { formatUnits } from 'viem';

function formatUSDC(amount: bigint): string {
  const formatted = formatUnits(amount, 6);
  return `$${Number(formatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface Contribution {
  bounty: {
    id: string;
    title: string;
    totalFunded: bigint;
    githubOwner: string;
    githubRepo: string;
  };
  repoSettings: {
    githubOwner: string;
    githubRepo: string;
  } | null;
  submission: {
    status: string;
    githubPrTitle: string | null;
  };
}

export interface ActivityContributionsContentProps {
  contributions: Contribution[];
}

export function ActivityContributionsContent({ contributions }: ActivityContributionsContentProps) {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contributions</h1>
        <p className="text-muted-foreground">Bounties you have completed</p>
      </div>

      {contributions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyMedia variant="icon">
                <TrendingUp />
              </EmptyMedia>
              <EmptyTitle>No Contributions Yet</EmptyTitle>
              <EmptyDescription>
                Complete bounties to see your contributions here.{' '}
                <Link href="/explore" className="text-primary hover:underline">
                  Find bounties to work on
                </Link>
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {contributions.map(({ bounty, repoSettings, submission }) => (
            <Link
              key={bounty.id}
              href={`/${bounty.githubOwner}/${bounty.githubRepo}/bounties/${bounty.id}`}
              className="block"
            >
              <Card className="hover:border-muted-foreground/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs text-muted-foreground">
                          {repoSettings?.githubOwner}/{repoSettings?.githubRepo}
                        </code>
                        <Badge
                          variant={submission.status === 'paid' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {submission.status}
                        </Badge>
                      </div>
                      <h3 className="font-medium truncate">{bounty.title}</h3>
                      {submission.githubPrTitle && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          PR: {submission.githubPrTitle}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">{formatUSDC(bounty.totalFunded)}</p>
                      <p className="text-xs text-muted-foreground">earned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
