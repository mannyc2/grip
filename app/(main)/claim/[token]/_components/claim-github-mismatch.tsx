'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { authClient } from '@/lib/auth/auth-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Claim GitHub Mismatch Component
 *
 * Shows error when user tries to claim payment with wrong GitHub account.
 *
 * GitHub ID verification (UX layer - early feedback for users)
 * Security enforcement happens in API route (app/api/claim/[token]/route.ts:69-74)
 *
 * Why both checks:
 * - Page check: Prevents user confusion, shows clear error message before they try to claim
 * - API check: Actual security enforcement (prevents bypass via direct API calls)
 *
 * Trade-off: Slight code duplication for better UX and security (defense in depth)
 */

type ClaimGithubMismatchProps = {
  expectedUsername: string;
  currentUsername: string;
  claimToken: string;
};

export function ClaimGithubMismatch({
  expectedUsername,
  currentUsername,
  claimToken,
}: ClaimGithubMismatchProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await authClient.signOut();
      // Redirect to claim page after sign out (will show login prompt)
      router.push(`/claim/${claimToken}`);
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Warning icon - using primary/10 for warning (not destructive, just info) */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <span className="text-3xl">⚠️</span>
          </div>

          <div className="gap-2">
            <h1 className="heading-2">Wrong GitHub Account</h1>
            <p className="body-base text-muted-foreground">
              This payment is intended for a different GitHub account.
            </p>
          </div>

          {/* Info box showing expected vs current account */}
          <div className="w-full rounded-lg bg-muted p-4 gap-2">
            <p className="body-sm text-muted-foreground">Payment for:</p>
            <p className="body-base font-medium">@{expectedUsername}</p>
            <p className="body-sm text-muted-foreground mt-2">You're logged in as:</p>
            <p className="body-base">@{currentUsername}</p>
          </div>

          {/* Action buttons */}
          <div className="w-full gap-4 flex flex-col">
            <Button onClick={handleSignOut} disabled={isSigningOut} className="w-full" size="lg">
              {isSigningOut ? 'Signing out...' : 'Sign Out & Switch Accounts'}
            </Button>
            <Button
              nativeButton={false}
              render={<Link href="/explore" />}
              variant="outline"
              className="w-full"
            >
              Back to Explore
            </Button>
          </div>

          <p className="body-sm text-muted-foreground">
            You must log in with @{expectedUsername} to claim this payment.
          </p>
        </div>
      </Card>
    </div>
  );
}
