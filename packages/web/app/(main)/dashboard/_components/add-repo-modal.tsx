'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExternalLink, User, Building2 } from 'lucide-react';

export type OwnedOrg = {
  id: string;
  name: string;
  slug: string;
};

type AddRepoModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownedOrgs?: OwnedOrg[];
};

export function AddRepoModal({ open, onOpenChange, ownedOrgs = [] }: AddRepoModalProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<string>('personal');

  const handleInstall = async () => {
    setIsRedirecting(true);
    try {
      const organizationId = selectedOwner === 'personal' ? undefined : selectedOwner;
      const res = await fetch('/api/github/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });
      const data = await res.json();
      if (data.error) {
        console.error('Failed to get install URL:', data.error);
        setIsRedirecting(false);
        return;
      }
      if (data.installUrl) {
        window.location.href = data.installUrl;
      }
    } catch (error) {
      console.error('Failed to get install URL:', error);
      setIsRedirecting(false);
    }
  };

  const hasOrgs = ownedOrgs.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect a Repository</DialogTitle>
          <DialogDescription>
            You'll be redirected to GitHub to install the GRIP app on your repository.
          </DialogDescription>
        </DialogHeader>

        {hasOrgs && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Claim for</span>
            <Select value={selectedOwner} onValueChange={(v) => v && setSelectedOwner(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">
                  <div className="flex items-center gap-2">
                    <User className="size-4" />
                    Personal account
                  </div>
                </SelectItem>
                {ownedOrgs.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4" />
                      {org.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedOwner === 'personal'
                ? 'You will own this repository on GRIP.'
                : 'The organization will own this repository. All org owners can manage settings.'}
            </p>
          </div>
        )}

        <div className="py-2 text-xs text-muted-foreground">
          <p>After installation, you can:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Create bounties on issues</li>
            <li>Receive contributions from developers</li>
            <li>Pay out bounties with your wallet</li>
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRedirecting}>
            Cancel
          </Button>
          <Button onClick={handleInstall} disabled={isRedirecting}>
            {isRedirecting ? 'Redirecting...' : 'Continue to GitHub'}
            {!isRedirecting && <ExternalLink className="ml-2 size-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
