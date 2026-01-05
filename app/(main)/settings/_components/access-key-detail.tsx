'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Key, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { revokeAccessKeyAction } from '../access-keys/_actions/revoke-access-key';

interface AccessKeyDetailProps {
  accessKey: {
    id: string;
    label: string | null;
    backendWalletAddress: string | null;
    status: string;
    createdAt: string | null;
    expiry: bigint | null;
    limits: Record<string, { initial: string; remaining: string }>;
    lastUsedAt: string | null;
  };
  variant: 'page' | 'modal';
}

export function AccessKeyDetail({ accessKey, variant }: AccessKeyDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isExpired = accessKey.expiry && Date.now() / 1000 > Number(accessKey.expiry);
  const isActive = accessKey.status === 'active' && !isExpired;
  const isRevoked = accessKey.status === 'revoked';

  function handleRevoke() {
    setError(null);
    startTransition(async () => {
      const result = await revokeAccessKeyAction(accessKey.id);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  // Format dates
  const createdDate = accessKey.createdAt
    ? new Date(accessKey.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  const expiryDate = accessKey.expiry
    ? new Date(Number(accessKey.expiry) * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Never';

  const lastUsedDate = accessKey.lastUsedAt
    ? new Date(accessKey.lastUsedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Never';

  // Format spending limits
  const limitEntries = Object.entries(accessKey.limits);
  const formattedLimits = limitEntries.map(([token, { initial, remaining }]) => ({
    token,
    initial: (BigInt(initial) / BigInt(1_000_000)).toString(),
    remaining: (BigInt(remaining) / BigInt(1_000_000)).toString(),
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        {variant === 'page' ? (
          <Link
            href="/settings/access-keys"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Access Keys
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
      </div>

      {/* Key info card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-muted p-2">
                <Key className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  {accessKey.label || 'Auto-Pay Access Key'}
                </CardTitle>
                <p className="text-sm text-muted-foreground font-mono">
                  {accessKey.backendWalletAddress
                    ? truncateAddress(accessKey.backendWalletAddress)
                    : 'Organization Access Key'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isActive && (
                <Badge variant="default" className="bg-primary">
                  Active
                </Badge>
              )}
              {isExpired && <Badge variant="secondary">Expired</Badge>}
              {isRevoked && <Badge variant="secondary">Revoked</Badge>}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-sm font-medium">{createdDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expires</p>
              <p className="text-sm font-medium">
                {expiryDate}
                {isExpired && (
                  <Badge variant="destructive" className="ml-2">
                    Expired
                  </Badge>
                )}
              </p>
            </div>
          </div>

          {/* Spending limits */}
          {formattedLimits.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Spending Limits</h4>
              <div className="space-y-2">
                {formattedLimits.map(({ token, initial, remaining }) => (
                  <div
                    key={token}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {truncateAddress(token)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${remaining} remaining</p>
                      <p className="text-xs text-muted-foreground">of ${initial} USDC</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last used */}
          <div>
            <p className="text-sm text-muted-foreground">Last Used</p>
            <p className="text-sm font-medium">{lastUsedDate}</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          {/* Revoke button */}
          {isActive && (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Revoke Access Key
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revoke Access Key?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will revoke the access key and disable auto-pay for future bounty payouts.
                    You will need to manually sign each payout or create a new access key.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={handleRevoke}>
                    Revoke
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function truncateAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
