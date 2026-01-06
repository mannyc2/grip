'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AutoClaimProps {
  owner: string;
  repo: string;
}

/**
 * Auto-triggers the claim flow on mount.
 * Redirects to GitHub App installation page.
 */
export function AutoClaim({ owner, repo }: AutoClaimProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function claim() {
      try {
        const res = await fetch(`/api/repos/${owner}/${repo}/claim`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to initiate claim');
        }
        window.location.href = data.installUrl;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to claim repository');
      }
    }
    claim();
  }, [owner, repo]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-destructive">{error}</p>
        <a href={`/${owner}/${repo}`} className="mt-4 text-primary hover:underline">
          Back to repository
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-4 text-muted-foreground">Redirecting to GitHub...</p>
    </div>
  );
}
