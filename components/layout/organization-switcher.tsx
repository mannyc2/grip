'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { authClient, useSession } from '@/lib/auth/auth-client';
import { Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';

// Organization type from Better Auth
interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date;
}

/**
 * OrganizationSwitcher - Switch between personal and organization contexts
 *
 * Rendering:
 * - Uses DropdownMenuRadioGroup for submenu integration
 * - DropdownMenuRadioItem provides built-in selection state and check icons
 * - No wrapper padding (submenu handles spacing)
 *
 * Features:
 * - Shows personal account + all organizations user belongs to
 * - Active indicator (checkmark) from DropdownMenuRadioItem
 * - Click to switch context immediately
 *
 * Data fetching:
 * - Uses Better Auth's organization.list() method
 * - Updates in real-time when orgs change
 *
 * Context switching:
 * - Personal: activeOrganizationId = null (value="personal")
 * - Organization: activeOrganizationId = org.id
 */
export function OrganizationSwitcher() {
  const { data: session } = useSession();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch organizations and active org on mount
  useEffect(() => {
    async function fetchOrganizations() {
      if (!session?.user) return;

      try {
        const response = await authClient.organization.list();
        // Better Auth returns {data: T[], error: null} format
        const orgs = Array.isArray(response?.data) ? response.data : [];
        setOrganizations(orgs);
        // Active org is stored in session object
        setActiveOrgId(session?.session?.activeOrganizationId || null);
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrganizations();
  }, [session?.user, session?.session?.activeOrganizationId]);

  // Switch organization context
  async function handleSwitch(value: string) {
    try {
      const orgId = value === 'personal' ? null : value;
      await authClient.organization.setActive({ organizationId: orgId });
      setActiveOrgId(orgId);
      // Refresh page to update org-specific data
      window.location.reload();
    } catch (error) {
      console.error('Failed to switch organization:', error);
    }
  }

  if (loading) {
    return (
      <DropdownMenuRadioGroup value="loading">
        <DropdownMenuRadioItem value="loading" disabled>
          <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
          <span className="text-sm">Loading...</span>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    );
  }

  const currentValue = activeOrgId || 'personal';

  return (
    <DropdownMenuRadioGroup value={currentValue} onValueChange={handleSwitch}>
      {/* Personal Account */}
      <DropdownMenuRadioItem value="personal">
        <Avatar className="h-8 w-8">
          <AvatarImage src={session?.user?.image ?? undefined} />
          <AvatarFallback className="text-xs">
            {session?.user?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium">@{session?.user?.name}</span>
          <span className="text-xs text-muted-foreground">Personal account</span>
        </div>
      </DropdownMenuRadioItem>

      {/* Organizations */}
      {organizations.map((org) => (
        <DropdownMenuRadioItem key={org.id} value={org.id}>
          {org.logo ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src={org.logo} />
              <AvatarFallback className="text-xs">
                {org.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="text-sm font-medium">{org.name}</span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}
