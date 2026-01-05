/**
 * Shared types for organization settings
 * Extracted from org-settings-layout.tsx for reuse across routes
 */

export type OrgRole = 'owner' | 'billingAdmin' | 'bountyManager' | 'member';

export interface OrgMemberPasskey {
  id: string;
  tempoAddress: string | null;
}

export interface OrgMember {
  id: string;
  role: string;
  sourceType: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    passkeys?: OrgMemberPasskey[];
  } | null;
}

export interface OrgAccessKey {
  id: string;
  organizationId: string | null;
  network: string;
  authorizedUserPasskeyId: string | null;
  keyType: string;
  chainId: number;
  expiry: bigint | null;
  limits: unknown;
  status: string;
  createdAt: Date | string | null;
  label: string | null;
  user: {
    id: string;
    name: string | null;
  } | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  githubOrgLogin: string | null;
  syncMembership: boolean | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
}

export interface OrgSettingsContext {
  organization: Organization;
  currentUserRole: OrgRole;
  isOwner: boolean;
  canViewWallet: boolean;
  canManageMembers: boolean;
  hasGitHubSync: boolean;
}
