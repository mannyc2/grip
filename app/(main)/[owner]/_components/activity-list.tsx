'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatUnits } from 'viem';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type ActivityType = 'completed' | 'funded' | 'in_progress';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string | null;
  repoOwner: string | null;
  repoName: string | null;
  amount: string | number | bigint; // Raw amount
  date: string | Date | null; // Display date info
  statusLabel?: string; // e.g. "Paid", "Open"
  url: string;
}

interface ActivityListProps {
  items: ActivityItem[];
}

export function ActivityList({ items }: ActivityListProps) {
  const completedItems = items.filter((i) => i.type === 'completed');
  const fundedItems = items.filter((i) => i.type === 'funded');
  const inProgressItems = items.filter((i) => i.type === 'in_progress');

  // Sort all lists by date desc
  const sortFn = (a: ActivityItem, b: ActivityItem) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return timeB - timeA;
  };

  const allSorted = [...items].sort(sortFn);
  const completedSorted = [...completedItems].sort(sortFn);
  const fundedSorted = [...fundedItems].sort(sortFn);
  const inProgressSorted = [...inProgressItems].sort(sortFn);

  const renderList = (list: ActivityItem[], emptyMsg: string) => {
    if (list.length === 0) {
      return (
        <div className="py-12 border border-dashed border-border rounded-lg">
          <Empty className="bg-transparent border-none">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="h-10 w-10 text-muted-foreground/30">
                <Activity strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle className="text-sm font-normal text-muted-foreground">
                {emptyMsg}
              </EmptyTitle>
            </EmptyHeader>
          </Empty>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((item) => (
          <Link key={`${item.type}-${item.id}`} href={item.url} className="block group">
            <div className="rounded-lg border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm">
              <div className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {item.title || 'Untitled Bounty'}
                  </h3>

                  {item.type === 'completed' && (
                    <Badge
                      variant="outline"
                      className="border-success/20 text-success bg-success/10 text-xs uppercase h-5 px-1.5 shrink-0"
                    >
                      Completed
                    </Badge>
                  )}
                  {item.type === 'funded' && (
                    <Badge
                      variant="outline"
                      className="border-primary/20 text-primary bg-primary/10 text-xs uppercase h-5 px-1.5 shrink-0"
                    >
                      Funded
                    </Badge>
                  )}
                  {item.type === 'in_progress' && (
                    <Badge
                      variant="outline"
                      className="border-chart-4/20 text-chart-4 bg-chart-4/10 text-xs uppercase h-5 px-1.5 shrink-0"
                    >
                      In Progress
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">
                    {item.repoOwner}/{item.repoName}
                  </span>
                  <span>·</span>
                  <span
                    className={cn(
                      'font-medium',
                      item.type === 'completed' ? 'text-success' : 'text-foreground'
                    )}
                  >
                    $
                    {typeof item.amount === 'string'
                      ? formatUnits(BigInt(item.amount), 6)
                      : item.amount}
                    {item.type === 'completed'
                      ? ' earned'
                      : item.type === 'funded'
                        ? ' funded'
                        : ''}
                  </span>
                  <span>·</span>
                  <span>
                    {item.date
                      ? new Date(item.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'No date'}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-8">
      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:pb-0">
          <TabsList
            variant="line"
            className="w-full justify-start h-9 p-0 bg-transparent border-b border-border/40 space-x-6"
          >
            <TabsTrigger
              value="all"
              className="h-full rounded-none border-0 px-0 pb-2 text-sm text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:bottom-[-1px] after:h-0.5 after:bg-primary"
            >
              All Activity
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="h-full rounded-none border-0 px-0 pb-2 text-sm text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:bottom-[-1px] after:h-0.5 after:bg-primary"
            >
              Completed{' '}
              <span className="ml-2 text-xs text-muted-foreground/60">{completedItems.length}</span>
            </TabsTrigger>
            <TabsTrigger
              value="funded"
              className="h-full rounded-none border-0 px-0 pb-2 text-sm text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:bottom-[-1px] after:h-0.5 after:bg-primary"
            >
              Funded{' '}
              <span className="ml-2 text-xs text-muted-foreground/60">{fundedItems.length}</span>
            </TabsTrigger>
            <TabsTrigger
              value="in_progress"
              className="h-full rounded-none border-0 px-0 pb-2 text-sm text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:bottom-[-1px] after:h-0.5 after:bg-primary"
            >
              In Progress{' '}
              <span className="ml-2 text-xs text-muted-foreground/60">
                {inProgressItems.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all">{renderList(allSorted, 'No bounty activity yet')}</TabsContent>
        <TabsContent value="completed">
          {renderList(completedSorted, 'No completed bounties yet')}
        </TabsContent>
        <TabsContent value="funded">
          {renderList(fundedSorted, 'No funded bounties yet')}
        </TabsContent>
        <TabsContent value="in_progress">
          {renderList(inProgressSorted, 'No bounties in progress')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
