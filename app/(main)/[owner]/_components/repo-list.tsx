import Link from 'next/link';
import { formatUnits } from 'viem';
import { FolderGit2, Star, GitFork } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Empty, EmptyTitle, EmptyHeader, EmptyMedia } from '@/components/ui/empty';

export interface RepoStats {
  id: number;
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;

  // GRIP stats
  bountyCount: number;
  totalValue: string | number | bigint; // Raw amount
}

interface RepoListProps {
  repos: RepoStats[];
  emptyMessage?: string;
  className?: string;
}

export function RepoList({
  repos,
  emptyMessage = 'No repositories with GRIP activity',
  className,
}: RepoListProps) {
  if (repos.length === 0) {
    return null; // As per design, hide section completely or show subtle empty state?
    // Prompt says: "Hide the section entirely if no repos"
  }

  return (
    <div className={cn('py-8 border-t border-border', className)}>
      <h2 className="mb-6 text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Active In
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {repos.map((repo) => (
          <Link
            key={repo.id}
            href={`/${repo.owner}/${repo.name}`}
            className="group block rounded-lg border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="font-medium group-hover:text-primary transition-colors">
                  {repo.owner}/{repo.name}
                </span>
              </div>

              <div className="text-right">
                <span className="block text-sm font-bold text-success">
                  {repo.bountyCount} bounties
                </span>
                <span className="text-xs text-muted-foreground uppercase">
                  $
                  {typeof repo.totalValue === 'string'
                    ? formatUnits(BigInt(repo.totalValue), 6)
                    : repo.totalValue}{' '}
                  Total
                </span>
              </div>
            </div>

            {repo.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                {repo.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
              {repo.language && (
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary/20" />
                  {repo.language}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {repo.stars}
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="h-3 w-3" />
                {repo.forks}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
