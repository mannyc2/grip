'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { cn } from '@/lib/utils';
import { signOut } from '@/lib/auth/auth-client';
import { UserAvatar } from '@/components/user/user-avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { SettingsUser, SettingsOrganization } from '../_lib/get-settings-layout-data';
import { settingsNavGroups, organizationIcon } from './settings-nav-items';

type SettingsModalShellProps = {
  user: SettingsUser;
  organizations: SettingsOrganization[];
  children: React.ReactNode;
};

type NavVariant = 'full' | 'icon';

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  variant: NavVariant;
};

function NavItem({ href, label, icon: Icon, isActive, variant }: NavItemProps) {
  const baseStyles = 'flex items-center rounded-md transition-colors';
  const activeStyles = 'bg-sidebar-accent text-sidebar-accent-foreground font-medium';
  const inactiveStyles = 'text-sidebar-foreground hover:bg-sidebar-accent/50';

  if (variant === 'icon') {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={href}
              className={cn(
                baseStyles,
                'justify-center size-10',
                isActive ? activeStyles : inactiveStyles
              )}
            />
          }
        >
          <Icon className="size-4" />
          <span className="sr-only">{label}</span>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        baseStyles,
        'gap-2 px-3 py-2 text-sm',
        isActive ? activeStyles : inactiveStyles
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}

function OrgNavItem({
  org,
  isActive,
  variant,
}: {
  org: SettingsOrganization;
  isActive: boolean;
  variant: NavVariant;
}) {
  const href = `/settings/organizations/${org.id}`;
  const label = org.name || org.slug;
  const baseStyles = 'flex items-center rounded-md transition-colors';
  const activeStyles = 'bg-sidebar-accent text-sidebar-accent-foreground font-medium';
  const inactiveStyles = 'text-sidebar-foreground hover:bg-sidebar-accent/50';
  const OrgIcon = organizationIcon;

  if (variant === 'icon') {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href={href}
              className={cn(
                baseStyles,
                'justify-center size-10',
                isActive ? activeStyles : inactiveStyles
              )}
            />
          }
        >
          <OrgIcon className="size-4" />
          <span className="sr-only">{label}</span>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        baseStyles,
        'gap-2 px-3 py-2 text-sm',
        isActive ? activeStyles : inactiveStyles
      )}
    >
      <OrgIcon className="size-4" />
      {label}
    </Link>
  );
}

/**
 * Responsive modal shell for settings
 *
 * - Tablet (md to lg): Icon-only sidebar with tooltips
 * - Desktop (>= lg): Full sidebar with icons + labels
 *
 * Mobile users are redirected to the full page settings by the modal layout.
 */
export function SettingsModalShell({ user, organizations, children }: SettingsModalShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Check if a path is active, handling both exact match and prefix match for nested routes
  const isPathActive = (href: string) => {
    if (href === '/settings') {
      return pathname === '/settings';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNavItems = (variant: NavVariant) => (
    <>
      {settingsNavGroups.map((group) => (
        <div key={group.title}>
          {variant === 'full' && (
            <div className="pt-4 pb-1 px-3 text-xs text-muted-foreground first:pt-0">
              {group.title}
            </div>
          )}
          {variant === 'icon' && group.title !== 'Account' && (
            <div className="my-2 mx-auto w-6 border-t" />
          )}
          {group.items.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={isPathActive(item.href)}
              variant={variant}
            />
          ))}
        </div>
      ))}
    </>
  );

  const renderOrgItems = (variant: NavVariant) => {
    if (organizations.length === 0) return null;

    return (
      <>
        {variant !== 'icon' && (
          <div className="pt-4 pb-1 px-3 text-xs text-muted-foreground">Organizations</div>
        )}
        {variant === 'icon' && <div className="my-2 mx-auto w-6 border-t" />}
        {organizations.map((org) => (
          <OrgNavItem
            key={org.id}
            org={org}
            isActive={pathname === `/settings/organizations/${org.id}`}
            variant={variant}
          />
        ))}
      </>
    );
  };

  const renderFooter = (variant: NavVariant) => (
    <div className={cn('border-t', variant === 'icon' ? 'p-1' : 'p-2')}>
      {variant === 'icon' ? (
        <Tooltip>
          <TooltipTrigger render={<div className="flex justify-center p-1" />}>
            <UserAvatar user={user} size="sm" />
          </TooltipTrigger>
          <TooltipContent side="right">{user.name}</TooltipContent>
        </Tooltip>
      ) : (
        <>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <UserAvatar user={user} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Tablet Sidebar - icon-only (md to lg) */}
      <aside className="hidden md:flex lg:hidden w-12 border-r bg-sidebar shrink-0 flex-col">
        <div className="p-2 border-b flex justify-center">
          <Tooltip>
            <TooltipTrigger
              render={
                <div className="size-8 rounded-md bg-sidebar-accent/50 flex items-center justify-center" />
              }
            >
              <span className="text-xs font-semibold">S</span>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </div>
        <nav className="flex-1 p-1 space-y-1 overflow-y-auto flex flex-col items-center">
          {renderNavItems('icon')}
          {renderOrgItems('icon')}
        </nav>
        {renderFooter('icon')}
      </aside>

      {/* Desktop Sidebar - visible lg:flex */}
      <aside className="hidden lg:flex w-64 border-r bg-sidebar shrink-0 flex-col">
        <div className="p-4 border-b">
          <span className="font-semibold text-sm">Settings</span>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {renderNavItems('full')}
          {renderOrgItems('full')}
        </nav>
        {renderFooter('full')}
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
