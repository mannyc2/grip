'use client';

import { formatUnits } from 'viem';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ActivityItem } from './activity-list';

interface OrgActivityProps {
  items: ActivityItem[];
}

export function OrgActivity({ items }: OrgActivityProps) {
  if (items.length === 0) {
    return (
      <Empty className="border-0 py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="h-10 w-10 text-muted-foreground/30">
            <Activity strokeWidth={1.5} />
          </EmptyMedia>
          <EmptyTitle className="text-sm font-normal text-muted-foreground">
            No activity yet
          </EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {items.map((item) => (
        <Link
          key={`${item.type}-${item.id}`}
          href={item.url}
          className="block group border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">
                  {item.repoOwner}/{item.repoName}
                </span>
                {item.date && (
                  <>
                    <span className="mx-1.5">·</span>
                    <span>
                      {new Date(item.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </>
                )}
              </div>
              <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-1">
                {item.title || 'Untitled Bounty'}
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {item.type === 'completed' ? (
                <Badge
                  variant="secondary"
                  className="bg-success/10 text-success border-success/20 text-xs uppercase"
                >
                  Completed
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/20 text-xs uppercase"
                >
                  Funded
                </Badge>
              )}
              <span
                className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full border',
                  item.type === 'completed'
                    ? 'bg-muted text-muted-foreground border-border'
                    : 'bg-success/10 text-success border-success/20'
                )}
              >
                ${Number(formatUnits(BigInt(item.amount), 6)).toLocaleString()}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
