import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatUnits } from 'viem';
import { Github, Calendar, Info, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ProfileHeaderProps {
  user: {
    avatarUrl: string | null;
    name: string | null;
    username: string; // GitHub login
    bio?: string | null;
    joinedAt?: string | Date | null; // GRIP join date
    htmlUrl: string;
  };
  stats?: {
    totalEarned: number | bigint;
    bountiesCompleted: number;
    bountiesFunded: number;
  };
  organizations?: {
    organization: {
      id: string | number;
      slug: string;
      logo: string | null;
      name: string;
    };
  }[];
  className?: string;
}

export function ProfileHeader({ user, stats, organizations = [], className }: ProfileHeaderProps) {
  const joinedDate = user.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const totalEarned = stats ? formatUnits(BigInt(stats.totalEarned), 6) : '0';
  const earnedVal = Number(totalEarned).toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className={cn('py-8', className)}>
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border border-border shrink-0">
          <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="text-2xl font-bold leading-tight truncate">
              {user.name || user.username}
            </h1>
            <span className="text-muted-foreground text-lg font-normal">@{user.username}</span>

            {organizations.length > 0 && (
              <div className="flex items-center gap-2 ml-1">
                {organizations.slice(0, 3).map((org) => (
                  <Link key={org.organization.id} href={`/${org.organization.slug}`}>
                    <Badge
                      variant="secondary"
                      className="gap-1 font-normal text-xs px-2 h-6 hover:bg-secondary/80"
                    >
                      {org.organization.name}
                    </Badge>
                  </Link>
                ))}
                {organizations.length > 3 && (
                  <Badge variant="outline" className="text-xs h-6 px-2">
                    +{organizations.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <Popover>
              <PopoverTrigger className="inline-flex items-center justify-center h-6 w-6 rounded-full hover:bg-muted text-muted-foreground transition-colors ml-1">
                <Info className="h-4 w-4" />
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback>{user.username.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{user.name || user.username}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {joinedDate && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {joinedDate}</span>
                      </div>
                    )}
                    <a
                      href={user.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Github className="h-4 w-4" />
                      <span>github.com/{user.username}</span>
                    </a>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {user.bio && (
            <p className="text-sm text-foreground/80 max-w-2xl line-clamp-2 leading-relaxed">
              {user.bio}
            </p>
          )}

          {stats && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground pt-1">
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                <span className="text-success">${earnedVal}</span> earned
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                <span>{stats.bountiesCompleted}</span> completed
              </span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5 text-foreground font-medium">
                <span>{stats.bountiesFunded}</span> funded
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
