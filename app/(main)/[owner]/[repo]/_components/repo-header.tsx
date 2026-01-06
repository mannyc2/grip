'use client';

import { TokenAmount } from '@/components/tempo/token-amount';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { GitHubRepo } from '@/lib/github';
import { cn } from '@/lib/utils';
import { Download, ExternalLink, GitFork, Github, Info, Plus, Settings, Star } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface RepoHeaderProps {
  github: GitHubRepo;
  stats: {
    totalFunded: string;
    openBounties: number;
    completedBounties: number;
  };
  isClaimed: boolean;
  canManage: boolean;
  isLoggedIn: boolean;
  owner: string;
  repo: string;
  className?: string;
}

export function RepoHeader({
  github,
  stats,
  isClaimed,
  canManage,
  isLoggedIn,
  owner,
  repo,
  className,
}: RepoHeaderProps) {
  const [claiming, setClaiming] = useState(false);

  async function handleClaim() {
    setClaiming(true);
    try {
      const res = await fetch(`/api/repos/${owner}/${repo}/claim`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.installUrl;
    } catch {
      setClaiming(false);
    }
  }

  return (
    <div className={cn('py-8', className)}>
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border border-border shrink-0">
          <AvatarImage src={github.owner.avatar_url} alt={github.owner.login} />
          <AvatarFallback>{github.owner.login.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-1">
          {/* Title row with actions on right */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="text-2xl font-bold leading-tight truncate">{github.full_name}</h1>

                <Popover>
                  <PopoverTrigger className="inline-flex items-center justify-center h-6 w-6 rounded-full hover:bg-muted text-muted-foreground transition-colors ml-1">
                    <Info className="h-4 w-4" />
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={github.owner.avatar_url} />
                          <AvatarFallback>{github.owner.login.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{github.full_name}</p>
                          <p className="text-xs text-muted-foreground">{github.owner.login}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <a
                          href={github.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Github className="h-4 w-4" />
                          <span>View on GitHub</span>
                        </a>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {isClaimed && canManage && (
                  <Link
                    href={`/${owner}/${repo}/settings`}
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'icon' }),
                      'h-6 w-6 ml-1'
                    )}
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                )}
              </div>

              {/* GitHub metadata */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  {github.stargazers_count.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <GitFork className="h-3.5 w-3.5" />
                  {github.forks_count.toLocaleString()}
                </span>
                {github.language && <span>{github.language}</span>}
              </div>
            </div>

            {/* Actions - right side */}
            <div className="flex items-center gap-2 shrink-0">
              {!isClaimed && isLoggedIn && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="outline" size="sm" onClick={handleClaim} disabled={claiming}>
                        <Download className="mr-2 h-4 w-4" />
                        {claiming ? 'Installing...' : 'Install GRIP'}
                      </Button>
                    }
                  />
                  <TooltipContent>
                    <p>Install the GRIP GitHub App to manage bounties</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {isLoggedIn ? (
                <Link
                  href={`/${owner}/${repo}/bounties/new`}
                  className={buttonVariants({ size: 'sm' })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Bounty
                </Link>
              ) : (
                <Link
                  href="/login"
                  className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                >
                  Sign in to fund
                </Link>
              )}
            </div>
          </div>

          {github.description && (
            <p className="text-sm text-foreground/80 max-w-2xl line-clamp-2 leading-relaxed">
              {github.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <span className="text-success">
                <TokenAmount amount={stats.totalFunded} symbol="$" />
              </span>{' '}
              funded
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <span>{stats.openBounties}</span> open
            </span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <span>{stats.completedBounties}</span> completed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
