'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatTimeAgo } from '@/lib/utils';
import { Building2, ExternalLink, Calendar, Trash2, Loader2, Eye, EyeOff, Users } from 'lucide-react';
import Link from 'next/link';
import { authClient } from '@/lib/auth/auth-client';

type OrgVisibility = 'public' | 'private' | 'members_only';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  githubOrgLogin: string | null;
  createdAt: Date;
  visibility: OrgVisibility;
}

interface GeneralContentProps {
  organization: Organization;
  isOwner: boolean;
}

export function GeneralContent({ organization, isOwner }: GeneralContentProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<OrgVisibility>(organization.visibility);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);

  const handleVisibilityChange = async (newVisibility: OrgVisibility) => {
    setIsUpdatingVisibility(true);
    setVisibilityError(null);

    try {
      const res = await fetch(`/api/organizations/${organization.id}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: newVisibility }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update visibility');
      }

      setVisibility(newVisibility);
      router.refresh();
    } catch (err) {
      setVisibilityError(err instanceof Error ? err.message : 'Failed to update visibility');
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleDeleteOrg = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    const result = await authClient.organization.delete({
      organizationId: organization.id,
    });

    if (result.error) {
      setDeleteError(result.error.message || 'Failed to delete organization');
      setIsDeleting(false);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div className="space-y-6">
      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Basic information about this organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="size-16">
              <AvatarImage src={organization.logo ?? undefined} alt={organization.name} />
              <AvatarFallback>
                <Building2 className="size-8" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{organization.name || organization.slug}</h3>
              <p className="text-sm text-muted-foreground">@{organization.slug}</p>
              {organization.githubOrgLogin && (
                <Link
                  href={`https://github.com/${organization.githubOrgLogin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  github.com/{organization.githubOrgLogin}
                  <ExternalLink className="size-3" />
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-4 pt-4 border-t">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created</span>
              <span>{formatTimeAgo(organization.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings - Owners only */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
            <CardDescription>Control who can see this organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {visibilityError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {visibilityError}
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium">Organization visibility</p>
                <p className="text-sm text-muted-foreground">
                  Choose who can view this organization&apos;s profile, bounties, and repositories.
                </p>
              </div>
              <Select
                value={visibility}
                onValueChange={(v) => handleVisibilityChange(v as OrgVisibility)}
                disabled={isUpdatingVisibility}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <Eye className="size-3.5" />
                    Public
                  </SelectItem>
                  <SelectItem value="members_only">
                    <Users className="size-3.5" />
                    Members only
                  </SelectItem>
                  <SelectItem value="private">
                    <EyeOff className="size-3.5" />
                    Private
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <p><strong>Public:</strong> Anyone can view the organization</p>
              <p><strong>Members only:</strong> Only members can view the organization</p>
              <p><strong>Private:</strong> Organization is hidden (404 for non-members)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone - Owners only */}
      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions for this organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {deleteError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {deleteError}
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Delete this organization</p>
                <p className="text-sm text-muted-foreground">
                  Once deleted, all bounties, settings, and member data will be permanently removed.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="destructive" size="sm" disabled={isDeleting}>
                      {isDeleting ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="size-4 mr-2" />
                      )}
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete <strong>{organization.name}</strong>? This
                      action cannot be undone. All bounties, member records, and settings will be
                      permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteOrg}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Organization'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
