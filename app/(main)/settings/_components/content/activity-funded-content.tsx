import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';
import Link from 'next/link';
import { formatUnits } from 'viem';

function formatUSDC(amount: bigint): string {
  const formatted = formatUnits(amount, 6);
  return `$${Number(formatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface FundedBounty {
  bounty: {
    id: string;
    title: string;
    status: string;
    totalFunded: bigint;
    githubOwner: string;
    githubRepo: string;
  };
  repoSettings: {
    githubOwner: string;
    githubRepo: string;
  } | null;
  submissionCount: number;
}

export interface ActivityFundedContentProps {
  bounties: FundedBounty[];
}

export function ActivityFundedContent({ bounties }: ActivityFundedContentProps) {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Funded Bounties</h1>
        <p className="text-muted-foreground">Bounties you have created and funded</p>
      </div>

      {bounties.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyMedia variant="icon">
                <CreditCard />
              </EmptyMedia>
              <EmptyTitle>No Bounties Created</EmptyTitle>
              <EmptyDescription>
                You haven&apos;t created any bounties yet.{' '}
                <Link href="/explore" className="text-primary hover:underline">
                  Explore bounties
                </Link>
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bounties.map(({ bounty, repoSettings, submissionCount }) => (
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
                          variant={bounty.status === 'open' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {bounty.status}
                        </Badge>
                      </div>
                      <h3 className="font-medium truncate">{bounty.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {submissionCount} submission{submissionCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatUSDC(bounty.totalFunded)}</p>
                      <p className="text-xs text-muted-foreground">USDC</p>
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
