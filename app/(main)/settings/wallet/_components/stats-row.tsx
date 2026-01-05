'use client';

import { StatCard } from '@/components/ui/stat-card';
import { cn } from '@/lib/utils';
import { formatUnits } from 'viem';

function formatUSDC(amount: string | bigint): string {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;
  const formatted = formatUnits(value, 6);
  return `$${Number(formatted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface ActivityStats {
  earned: { total: string; count: number };
  pending: { total: string; count: number };
  created: { total: string; count: number };
  claimed: { count: number };
}

interface StatsRowProps {
  stats: ActivityStats;
  isModal?: boolean;
}

export function StatsRow({ stats, isModal = false }: StatsRowProps) {
  return (
    <div
      className={cn(
        isModal
          ? 'flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 scrollbar-none'
          : 'grid grid-cols-2 md:grid-cols-4 gap-4'
      )}
    >
      <StatCard
        label="Total Earned"
        value={formatUSDC(stats.earned.total)}
        info={`${stats.earned.count} bounties completed`}
        className={cn(isModal && 'shrink-0 min-w-[140px]')}
      />
      <StatCard
        label="Pending Payouts"
        value={formatUSDC(stats.pending.total)}
        info={`${stats.pending.count} awaiting payment`}
        className={cn(isModal && 'shrink-0 min-w-[140px]')}
      />
      <StatCard
        label="Bounties Created"
        value={formatUSDC(stats.created.total)}
        info={`${stats.created.count} bounties funded`}
        className={cn(isModal && 'shrink-0 min-w-[140px]')}
      />
      <StatCard
        label="Bounties Claimed"
        value={stats.claimed.count.toString()}
        info="Total submissions made"
        className={cn(isModal && 'shrink-0 min-w-[140px]')}
      />
    </div>
  );
}
