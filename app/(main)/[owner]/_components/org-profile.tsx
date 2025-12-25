'use client';

import type { GitHubOrganization } from '@/lib/github/organizations';
import type { GitHubRepo } from '@/lib/github/api';
import type { organization } from '@/db/schema/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface OrgProfileProps {
  github: GitHubOrganization;
  repos: GitHubRepo[];
  gripOrg: typeof organization.$inferSelect | null;
  bountyData: {
    funded: Array<{
      id: string;
      title: string;
      amount: bigint;
      status: 'open' | 'completed' | 'cancelled';
      githubOwner: string;
      githubRepo: string;
      githubIssueNumber: number;
      createdAt: string | null;
    }>;
    totalFunded: bigint;
    fundedCount: number;
  } | null;
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      image: string | null;
    } | null;
  }> | null;
  isLoggedIn: boolean;
}

/**
 * Organization profile component
 *
 * Shows GitHub org info with GRIP overlay if org is linked.
 * Minimal implementation - full org dashboard to come in future update.
 */
export function OrgProfile({
  github,
  repos,
  gripOrg,
  bountyData,
  members,
  isLoggedIn,
}: OrgProfileProps) {
  return (
    <div className="container mx-auto max-w-6xl py-8">
      {/* Org Header */}
      <div className="mb-8 flex items-start gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={github.avatar_url} alt={github.login} />
          <AvatarFallback>{github.login[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{github.name || github.login}</h1>
            <Link
              href={`https://github.com/${github.login}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground">@{github.login}</p>
          {github.description && <p className="mt-2 text-sm">{github.description}</p>}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Repositories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repos.length}</div>
            <p className="text-xs text-muted-foreground">Public repositories</p>
          </CardContent>
        </Card>

        {gripOrg && bountyData && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Bounties Funded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bountyData.fundedCount}</div>
                <p className="text-xs text-muted-foreground">
                  ${(Number(bountyData.totalFunded) / 1e6).toLocaleString()} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{members?.length || 0}</div>
                <p className="text-xs text-muted-foreground">In GRIP</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Repositories */}
      {repos.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Repositories</CardTitle>
            <CardDescription>Public repositories from GitHub</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {repos.slice(0, 10).map((repo) => (
                <div
                  key={repo.id}
                  className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <Link
                      href={`/${github.login}/${repo.name}`}
                      className="font-medium hover:underline"
                    >
                      {repo.name}
                    </Link>
                    {repo.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{repo.description}</p>
                    )}
                    <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                      {repo.language && <span>{repo.language}</span>}
                      <span>⭐ {repo.stargazers_count}</span>
                      <span>🍴 {repo.forks_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholder for future org dashboard */}
      {!gripOrg && (
        <Card>
          <CardHeader>
            <CardTitle>Organization Dashboard</CardTitle>
            <CardDescription>
              Link this organization to GRIP to unlock more features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Full organization dashboard with bounty management, team member access control, and
              payment flows coming soon.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
