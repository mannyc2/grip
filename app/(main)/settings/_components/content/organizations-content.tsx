import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Building2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export interface OrganizationMembership {
  role: string;
  organization: {
    id: string;
    name: string | null;
    slug: string;
    logo: string | null;
    githubOrgLogin: string | null;
  };
}

export interface OrganizationsContentProps {
  memberships: OrganizationMembership[];
}

export function OrganizationsContent({ memberships }: OrganizationsContentProps) {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organizations</h1>
        <p className="text-muted-foreground">Organizations you are a member of</p>
      </div>

      {memberships.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyMedia variant="icon">
                <Building2 />
              </EmptyMedia>
              <EmptyTitle>No Organizations</EmptyTitle>
              <EmptyDescription>You are not a member of any organizations yet.</EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {memberships.map((membership) => {
            const org = membership.organization;
            const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';

            return (
              <Card key={org.id} className="hover:border-muted-foreground/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={org.logo ?? undefined} alt={org.name ?? org.slug} />
                        <AvatarFallback>
                          <Building2 className="size-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{org.name || org.slug}</h3>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {membership.role}
                          </Badge>
                        </div>
                        {org.githubOrgLogin && (
                          <p className="text-sm text-muted-foreground">@{org.githubOrgLogin}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {org.githubOrgLogin && (
                        <Link
                          href={`https://github.com/${org.githubOrgLogin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground p-1"
                        >
                          <ExternalLink className="size-4" />
                        </Link>
                      )}
                      {isOwnerOrAdmin && (
                        <Link
                          href={`/settings/organizations/${org.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Settings
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
