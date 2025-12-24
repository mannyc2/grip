import { passkeyClient } from '@better-auth/passkey/client';
import { createAuthClient } from 'better-auth/react';
import { inferOrgAdditionalFields, organizationClient } from 'better-auth/client/plugins';
import { ac, billingAdmin, bountyManager, member, owner } from './permissions';
import { tempoClient } from './tempo-plugin/tempo-client';
import type { auth } from './auth';

/**
 * better-auth client configuration
 *
 * Provides:
 * - useSession hook for auth state
 * - signIn/signOut methods
 * - passkey.register/authenticate for wallet creation
 * - organization methods for multi-user orgs
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [
    passkeyClient(),
    tempoClient(),
    organizationClient({
      ac,
      roles: { owner, billingAdmin, bountyManager, member },
      schema: inferOrgAdditionalFields<typeof auth>(),
    }),
  ],
});

export const { signIn, signOut, useSession, passkey } = authClient;
