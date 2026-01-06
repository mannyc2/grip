'use client';

import { BountyCard } from '@/components/bounty/bounty-card';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Bounty } from '@/lib/types';
import { Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface BountyListProps {
  bounties: Bounty[];
  isClaimed: boolean;
  owner: string;
  repo: string;
}

type FilterStatus = 'all' | 'open' | 'claimed' | 'completed';
type SortOption = 'newest' | 'value' | 'oldest';

export function BountyList({ bounties, isClaimed, owner, repo }: BountyListProps) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');
  const [filteredBounties, setFilteredBounties] = useState(bounties);

  useEffect(() => {
    let result = [...bounties];

    // 1. Filter by Status
    if (filter !== 'all') {
      if (filter === 'claimed') {
        // "Claimed" means open but has submissions (work in progress)
        result = result.filter(
          (b) => b.status === 'open' && b.submissions && b.submissions.length > 0
        );
      } else if (filter === 'open') {
        // "Open" here could mean strictly untouched, or just status=open.
        // Let's assume user wants "Available" so exclude ones with submissions?
        // Or keep it simple: matches status.
        // Design prompt said: "[All] [Open] [Claimed] [Done]".
        // If "Claimed" is a tab, "Open" likely means "Available / No claims".
        result = result.filter(
          (b) => b.status === 'open' && (!b.submissions || b.submissions.length === 0)
        );
      } else {
        // Completed/Cancelled
        result = result.filter((b) => b.status === 'completed');
      }
    }

    // 2. Filter by Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.githubRepo.toLowerCase().includes(q) ||
          b.labels?.some((l) => l.name.toLowerCase().includes(q)) ||
          b.githubIssueNumber.toString().includes(q)
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      const valA = a.totalFunded ? BigInt(a.totalFunded) : BigInt(0);
      const valB = b.totalFunded ? BigInt(b.totalFunded) : BigInt(0);
      const timeA = new Date(a.createdAt ?? 0).getTime();
      const timeB = new Date(b.createdAt ?? 0).getTime();

      switch (sort) {
        case 'value':
          return valA > valB ? -1 : valA < valB ? 1 : 0;
        case 'oldest':
          return timeA - timeB;
        default:
          return timeB - timeA;
      }
    });

    setFilteredBounties(result);
  }, [bounties, filter, search, sort]);

  const counts = {
    all: bounties.length,
    open: bounties.filter(
      (b) => b.status === 'open' && (!b.submissions || b.submissions.length === 0)
    ).length,
    claimed: bounties.filter(
      (b) => b.status === 'open' && b.submissions && b.submissions.length > 0
    ).length,
    completed: bounties.filter((b) => b.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-border bg-card/50 p-1">
        {/* Left: Tabs */}
        <Tabs
          defaultValue="all"
          value={filter}
          onValueChange={(v) => setFilter(v as FilterStatus)}
          className="w-full lg:w-auto"
        >
          <TabsList variant="line" className="w-full justify-start border-b-0 p-0 h-auto gap-4">
            <TabsTrigger
              value="all"
              className="rounded-none border-b-2 border-transparent px-2 pb-2 pt-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              All <span className="ml-1.5 text-muted-foreground">{counts.all}</span>
            </TabsTrigger>
            <TabsTrigger
              value="open"
              className="rounded-none border-b-2 border-transparent px-2 pb-2 pt-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Open <span className="ml-1.5 text-muted-foreground">{counts.open}</span>
            </TabsTrigger>
            <TabsTrigger
              value="claimed"
              className="rounded-none border-b-2 border-transparent px-2 pb-2 pt-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Claimed <span className="ml-1.5 text-muted-foreground">{counts.claimed}</span>
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="rounded-none border-b-2 border-transparent px-2 pb-2 pt-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Done <span className="ml-1.5 text-muted-foreground">{counts.completed}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Right: Search & Sort */}
        <div className="flex items-center gap-2 px-1 pb-1 lg:pb-0">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bounties..."
              className="pl-9 h-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[140px] h-9 bg-background/50 border-border/50">
              <SelectValue>Sort by</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="value">Highest Value</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List Content */}
      {filteredBounties.length > 0 ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {filteredBounties.map((bounty) => (
            <BountyCard key={bounty.id} bounty={bounty} variant="row" showRepo={false} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          {bounties.length === 0 ? (
            <Empty className="border-border bg-card/30 py-16">
              <EmptyHeader>
                <EmptyTitle className="text-xl font-semibold tracking-tight mb-2">
                  No bounties yet
                </EmptyTitle>
                <EmptyDescription className="text-muted-foreground max-w-[420px] mb-8 text-sm leading-relaxed">
                  This repository doesn&apos;t have any bounties.
                  <br />
                  Be the first to fund work on an issue.
                </EmptyDescription>
                <Link
                  href={`/${owner}/${repo}/bounties/new`}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Bounty
                </Link>
              </EmptyHeader>
            </Empty>
          ) : (
            <Empty className="border-border bg-card/30 py-16">
              <EmptyHeader>
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground">
                  <Search className="h-6 w-6" />
                </div>
                <EmptyTitle className="text-lg font-semibold mb-2">
                  No bounties matching your filters
                </EmptyTitle>
                <EmptyDescription className="text-muted-foreground max-w-sm mb-6">
                  Try adjusting your search or filter criteria.
                </EmptyDescription>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilter('all');
                    setSearch('');
                  }}
                >
                  Clear all filters
                </Button>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      )}
    </div>
  );
}
