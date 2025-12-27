import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export interface Organization {
  id: string;
  name: string | null;
  slug: string;
  logo: string | null;
  githubOrgLogin: string | null;
}

export interface OrganizationDetailContentProps {
  organization: Organization;
}

export function OrganizationDetailContent({ organization: org }: OrganizationDetailContentProps) {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">Manage {org.name || org.slug}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Basic information about this organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={org.logo ?? undefined} alt={org.name ?? org.slug} />
              <AvatarFallback>
                <Building2 className="size-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{org.name || org.slug}</h3>
              {org.githubOrgLogin && (
                <Link
                  href={`https://github.com/${org.githubOrgLogin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  @{org.githubOrgLogin}
                  <ExternalLink className="size-3" />
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Team members of this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Member management coming soon.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wallet & Access Keys</CardTitle>
          <CardDescription>Organization wallet and auto-pay settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Organization wallet management coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
