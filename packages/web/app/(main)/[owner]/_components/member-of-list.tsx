import Link from 'next/link';
import type { getUserOrganizations } from '@/db/queries/users';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2 } from 'lucide-react';

interface MemberOfListProps {
  organizations: Awaited<ReturnType<typeof getUserOrganizations>>;
  className?: string;
}

export function MemberOfList({ organizations, className }: MemberOfListProps) {
  if (!organizations || organizations.length === 0) {
    return null;
  }

  return (
    <div className={cn('py-8 border-t border-border', className)}>
      <h2 className="mb-6 text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Member Of
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {organizations.map((membership) => (
          <Link
            key={membership.organization.id}
            href={`/${membership.organization.slug}`}
            className="group block rounded-lg border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage
                  src={membership.organization.logo || undefined}
                  alt={membership.organization.name}
                />
                <AvatarFallback>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {membership.organization.name}
                </h3>
                {membership.organization.githubOrgLogin && (
                  <p className="text-xs text-muted-foreground truncate font-mono">
                    @{membership.organization.githubOrgLogin}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
