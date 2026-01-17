'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatTimeAgo } from '@/lib/utils';
import {
  CheckCircle2,
  ExternalLink,
  Github,
  HelpCircle,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface GitHubContentProps {
  organizationId: string;
  githubOrgLogin: string;
  lastSyncedAt: Date | null;
}

interface SyncResult {
  added: number;
  removed: number;
  errors: string[];
}

export function GitHubContent({
  organizationId,
  githubOrgLogin,
  lastSyncedAt,
}: GitHubContentProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [localLastSyncedAt, setLocalLastSyncedAt] = useState(lastSyncedAt);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncResult(null);
      setSyncError(null);

      const res = await fetch('/api/organizations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setSyncResult(data);
      setLocalLastSyncedAt(new Date());
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>GitHub Connection</CardTitle>
            <Popover>
              <PopoverTrigger className="text-muted-foreground hover:text-foreground transition-colors">
                <HelpCircle className="size-4" />
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <p className="font-medium text-sm">About GitHub Sync</p>
                  <p className="text-sm text-muted-foreground">
                    GitHub sync automatically adds organization members who have BountyLane
                    accounts. Members without accounts won&apos;t be added until they sign up.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Owner</strong> and <strong>Billing Admin</strong> roles are never
                    automatically assigned — these must be set manually for security.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Only members added via sync will be removed when they leave the GitHub org.
                    Manually invited members are preserved.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <CardDescription>Sync organization members from GitHub</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connected Org */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                <Github className="size-5" />
              </div>
              <div>
                <p className="font-medium">@{githubOrgLogin}</p>
                <Link
                  href={`https://github.com/${githubOrgLogin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  github.com/{githubOrgLogin}
                  <ExternalLink className="size-3" />
                </Link>
              </div>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success">
              Connected
            </Badge>
          </div>

          {/* Sync Status */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Last synced</p>
                <p className="font-medium">
                  {localLastSyncedAt ? formatTimeAgo(localLastSyncedAt) : 'Never'}
                </p>
              </div>
              <Button onClick={handleSync} disabled={isSyncing}>
                {isSyncing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>

            {/* Sync Result */}
            {syncResult && (
              <Alert className="bg-success/10 border-success/20">
                <CheckCircle2 className="size-4 text-success" />
                <AlertTitle className="text-success">Sync Complete</AlertTitle>
                <AlertDescription>
                  {syncResult.added} member{syncResult.added !== 1 ? 's' : ''} added,{' '}
                  {syncResult.removed} removed
                  {syncResult.errors.length > 0 && (
                    <span className="block mt-1 text-destructive">
                      {syncResult.errors.length} error{syncResult.errors.length !== 1 ? 's' : ''}{' '}
                      occurred
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Sync Error */}
            {syncError && (
              <Alert variant="destructive">
                <XCircle className="size-4" />
                <AlertTitle>Sync Failed</AlertTitle>
                <AlertDescription>{syncError}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Mapping Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role Mapping</CardTitle>
          <CardDescription>How GitHub organization roles map to BountyLane roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2">
                <Badge variant="outline">GitHub Admin</Badge>
                <span className="text-muted-foreground">→</span>
              </div>
              <Badge variant="secondary">Bounty Manager</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">GitHub Member</Badge>
                <span className="text-muted-foreground">→</span>
              </div>
              <Badge variant="outline">Member</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
