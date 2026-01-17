'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard } from 'lucide-react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import type { FundedBountyResult } from '../_lib/actions';

function formatUSDC(amount: string | bigint): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  const formatted = formatUnits(value, 6);
  return `$${Number(formatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface FundedTabProps {
  bounties: FundedBountyResult[];
  isLoading: boolean;
  error: string | null;
  isModal?: boolean;
}

export function FundedTab({ bounties, isLoading, error, isModal }: FundedTabProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <Empty>
            <EmptyMedia variant="icon">
              <CreditCard />
            </EmptyMedia>
            <EmptyTitle>Failed to load</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  if (bounties.length === 0) {
    return (
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
    );
  }

  return (
    <ItemGroup>
      {bounties.map(({ bounty, repoSettings, submissionCount }) => (
        <Item
          key={bounty.id}
          variant="outline"
          render={
            <Link href={`/${bounty.githubOwner}/${bounty.githubRepo}/bounties/${bounty.id}`} />
          }
        >
          <ItemContent>
            <ItemTitle>
              {bounty.title}
              <Badge
                variant={bounty.status === 'open' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {bounty.status}
              </Badge>
            </ItemTitle>
            <ItemDescription>
              {repoSettings?.githubOwner ?? bounty.githubOwner}/
              {repoSettings?.githubRepo ?? bounty.githubRepo} · {submissionCount} submission
              {submissionCount !== 1 ? 's' : ''}
            </ItemDescription>
          </ItemContent>
          <ItemContent className="items-end">
            <span className="font-bold">{formatUSDC(bounty.totalFunded)}</span>
            <span className="text-xs text-muted-foreground">USDC</span>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  );
}
