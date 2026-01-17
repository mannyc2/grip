'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getVisibleNavItems } from './org-settings-nav-items';
import type { Organization, OrgSettingsContext } from '../_lib/types';

interface OrgSettingsSidebarProps {
  organization: Organization;
  context: OrgSettingsContext;
  variant?: 'sidebar' | 'floating' | 'inset';
}

export function OrgSettingsSidebar({
  organization,
  context,
  variant = 'inset',
}: OrgSettingsSidebarProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const visibleItems = getVisibleNavItems(context);

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar variant={variant}>
      <SidebarContent>
        {/* Org Header */}
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="flex items-center gap-3 px-2 py-3">
              <Avatar className="size-10">
                <AvatarImage src={organization.logo ?? undefined} alt={organization.name} />
                <AvatarFallback>
                  <Building2 className="size-5" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{organization.name || organization.slug}</p>
                <p className="text-xs text-muted-foreground">Organization Settings</p>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Nav Items */}
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const href = item.href(organization.slug);
                const isActive = pathname === href;

                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={
                        <a href={href} onClick={handleNavClick}>
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </a>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
