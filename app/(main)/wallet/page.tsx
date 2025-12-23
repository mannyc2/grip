import { getPasskeysByUser } from '@/db/queries/passkeys';
import { getPayoutsByUser, getSentDirectPayments } from '@/db/queries/payouts';
import { getPendingPaymentsByFunder } from '@/db/queries/pending-payments';
import { getSession } from '@/lib/auth/auth-server';
import { Wallet as WalletIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ActivityFeed } from './_components/activity-feed';
import { BalanceDisplay } from './_components/balance-display';
import { CreateWalletButton } from './_components/create-wallet-button';
import { PendingLiabilitiesWarning } from './_components/pending-liabilities-warning';
import { WalletActions } from './_components/wallet-actions';

export const metadata: Metadata = {
  title: 'Wallet',
  description: 'Manage your GRIP wallet and payments',
};

/**
 * Wallet page (protected) - Server component with small client components
 *
 * Server component pattern:
 * - Fetches passkey data server-side (SSR)
 * - Renders static parts (header, address display, layout)
 * - Embeds small client components for interactive parts:
 *   - BalanceDisplay (polling)
 *   - WalletActions (modal state)
 *   - CreateWalletButton (passkey creation)
 *
 * Design decisions:
 * - Balance section with large amount display (like MeritSystems)
 * - Fund Account as primary CTA, Withdraw as secondary
 * - Activity tabs showing different transaction types
 * - Explorer link integrated into header
 * - Wallet creation flow integrated (moved from dashboard)
 *
 * IMPORTANT: Tempo has no native token - balance must use TIP20.balanceOf()
 */

export default async function WalletPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }

  // Fetch passkey data server-side
  const passkeys = await getPasskeysByUser(session.user.id);
  const wallet = passkeys.find((p) => p.tempoAddress) ?? null;

  // No wallet - show creation flow
  if (!wallet?.tempoAddress) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold">Wallet</h1>
              <p className="text-muted-foreground">Create a wallet to receive bounty payments.</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <WalletIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Create Your Wallet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Your wallet is secured by a passkey (TouchID/FaceID). Your blockchain address is
                derived from the passkey&apos;s cryptographic public key.
              </p>
              <CreateWalletButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch earnings, sent payments, and pending payments data server-side
  const [earnings, sentPayments, pendingPaymentsRaw] = await Promise.all([
    getPayoutsByUser(session.user.id),
    getSentDirectPayments(session.user.id),
    getPendingPaymentsByFunder(session.user.id),
  ]);

  // Convert bigint amounts to strings for client component
  // Design Decision: Server component serialization boundary
  // - Alternative rejected: Change interface to bigint (breaks JSON serialization)
  // - Alternative rejected: Convert in query (inconsistent with other queries)
  // - Chosen approach: Map at server component boundary (matches API route pattern)
  // Trade-off: Extra mapping step for type safety + clear serialization boundary
  const pendingPayments = pendingPaymentsRaw.map((p) => ({
    id: p.id,
    amount: p.amount.toString(), // bigint → string for client component
    tokenAddress: p.tokenAddress,
    recipientGithubUsername: p.recipientGithubUsername,
    bountyId: p.bountyId,
    submissionId: p.submissionId,
    status: p.status,
    createdAt: p.createdAt,
    claimExpiresAt: p.claimExpiresAt,
    claimToken: p.claimToken,
    bountyTitle: p.bountyTitle,
    bountyGithubFullName: p.bountyGithubFullName,
  }));

  // Has wallet - show wallet view
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Balance Section */}
        <section className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Balance</p>
            {/* Client component for real-time balance polling */}
            <BalanceDisplay walletAddress={wallet.tempoAddress} />
          </div>

          {/* Client component for modal state management */}
          <WalletActions walletAddress={wallet.tempoAddress} balance={0} />
        </section>

        {/* Pending Liabilities Warning */}
        <PendingLiabilitiesWarning walletAddress={wallet.tempoAddress} />

        {/* Activity Section */}
        <section>
          <h2 className="text-lg font-medium mb-4">Activity</h2>
          <ActivityFeed
            earnings={earnings}
            sentPayments={sentPayments}
            pendingPayments={pendingPayments}
          />
        </section>
      </div>
    </div>
  );
}
