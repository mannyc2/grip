'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Building2, Loader2, User } from 'lucide-react';
import { transferRepoOwnership } from '../_actions/transfer-ownership';

interface TransferOwnershipProps {
  githubRepoId: number;
  owner: string;
  repo: string;
}

type OwnerInfo = {
  type: 'user' | 'organization' | 'unclaimed';
  id?: string;
  name?: string;
};

type OwnedOrg = {
  id: string;
  name: string;
  slug: string;
};

export function TransferOwnership({ githubRepoId, owner, repo }: TransferOwnershipProps) {
  const [currentOwner, setCurrentOwner] = useState<OwnerInfo | null>(null);
  const [ownedOrgs, setOwnedOrgs] = useState<OwnedOrg[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fetch current owner and available transfer targets
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        const [settingsRes, orgsRes] = await Promise.all([
          fetch(`/api/repo-settings/${githubRepoId}`),
          fetch('/api/github/organizations'),
        ]);

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          const settings = data.repoSettings;

          if (settings.verifiedOwnerOrganizationId) {
            setCurrentOwner({
              type: 'organization',
              id: settings.verifiedOwnerOrganizationId,
              name: settings.organizationName || 'Organization',
            });
          } else if (settings.verifiedOwnerUserId) {
            setCurrentOwner({
              type: 'user',
              id: settings.verifiedOwnerUserId,
              name: 'You',
            });
          } else {
            setCurrentOwner({ type: 'unclaimed' });
          }
        }

        if (orgsRes.ok) {
          const orgsData = await orgsRes.json();
          // Filter to only orgs where user is owner
          const owned = orgsData.organizations?.filter((o: { role: string }) => o.role === 'owner') || [];
          setOwnedOrgs(owned.map((o: { id: string; name: string; slug: string }) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
          })));
        }
      } catch (err) {
        console.error('Failed to fetch transfer data:', err);
        setError('Failed to load ownership information');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [githubRepoId]);

  const handleTransfer = () => {
    if (!selectedTarget) return;

    startTransition(async () => {
      const targetType = selectedTarget === 'personal' ? 'user' : 'organization';
      const targetId = selectedTarget === 'personal' ? currentOwner?.id || '' : selectedTarget;

      const result = await transferRepoOwnership(
        githubRepoId.toString(),
        targetType,
        targetId
      );

      if (result.success) {
        // Refresh the page to show updated ownership
        window.location.reload();
      } else {
        setError(result.error || 'Failed to transfer ownership');
        setShowConfirm(false);
      }
    });
  };

  const getTargetLabel = () => {
    if (selectedTarget === 'personal') return 'your personal account';
    const org = ownedOrgs.find((o) => o.id === selectedTarget);
    return org ? org.name : 'selected organization';
  };

  if (isLoading) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Transfer Ownership</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Build available targets (exclude current owner)
  const availableTargets: { value: string; label: string; icon: typeof User }[] = [];

  if (currentOwner?.type === 'organization') {
    // If org-owned, can transfer to personal
    availableTargets.push({
      value: 'personal',
      label: 'Personal account',
      icon: User,
    });
  }

  // Add orgs (excluding current owner org)
  for (const org of ownedOrgs) {
    if (currentOwner?.type !== 'organization' || currentOwner.id !== org.id) {
      availableTargets.push({
        value: org.id,
        label: org.name,
        icon: Building2,
      });
    }
  }

  const hasTargets = availableTargets.length > 0;

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Transfer Ownership</CardTitle>
          <CardDescription>
            Transfer this repository to another owner. This action can be reversed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Current owner</div>
            <div className="flex items-center gap-2 text-sm font-medium">
              {currentOwner?.type === 'organization' ? (
                <>
                  <Building2 className="size-4" />
                  {currentOwner.name}
                </>
              ) : currentOwner?.type === 'user' ? (
                <>
                  <User className="size-4" />
                  You (personal account)
                </>
              ) : (
                <span className="text-muted-foreground">Unclaimed</span>
              )}
            </div>
          </div>

          {hasTargets ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Transfer to</div>
              <Select value={selectedTarget} onValueChange={(v) => v && setSelectedTarget(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>Select new owner</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableTargets.map((target) => (
                    <SelectItem key={target.value} value={target.value}>
                      <div className="flex items-center gap-2">
                        <target.icon className="size-4" />
                        {target.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                No transfer targets available. You need to be an owner of at least one organization
                to transfer ownership.
              </AlertDescription>
            </Alert>
          )}

          <Button
            variant="destructive"
            disabled={!selectedTarget || isPending}
            onClick={() => setShowConfirm(true)}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Transfer Ownership
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Repository Ownership</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to transfer <strong>{owner}/{repo}</strong> to{' '}
              <strong>{getTargetLabel()}</strong>?
              <br /><br />
              The new owner will be able to manage all repository settings. This action can be
              reversed by the new owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTransfer}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
