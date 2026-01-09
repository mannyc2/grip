'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authClient } from '@/lib/auth/auth-client';
import { useEffect, useState } from 'react';
import { PasskeyManager } from '../../_components/passkey-manager';
import { type ActivityStats, StatsRow } from './stats-row';
import { WalletHero } from './wallet-hero';
import { WalletTabs } from './wallet-tabs';

interface Wallet {
  id: string;
  credentialID: string;
  name: string | null;
  tempoAddress: `0x${string}`;
  createdAt: string;
}

export interface WalletContentProps {
  stats: ActivityStats;
  isModal?: boolean;
}

export function WalletContent({ stats, isModal = false }: WalletContentProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchWallet() {
      setIsLoading(true);
      try {
        // Fetch both wallets and passkeys to get credentialID for deletion
        const [walletsRes, passkeysRes] = await Promise.all([
          authClient.listWallets(),
          authClient.listTempoPasskeys(),
        ]);

        const passkeyWallet = walletsRes.data?.wallets.find((w) => w.walletType === 'passkey');
        const passkeys = passkeysRes.data ?? [];

        if (passkeyWallet?.address && passkeyWallet.passkeyId) {
          // Find the passkey to get its credentialID
          const passkey = passkeys.find((p) => p.id === passkeyWallet.passkeyId);
          if (passkey) {
            setWallet({
              id: passkey.id,
              credentialID: passkey.credentialID,
              name: passkey.name ?? passkeyWallet.label ?? null,
              tempoAddress: passkeyWallet.address as `0x${string}`,
              createdAt: passkey.createdAt ?? new Date().toISOString(),
            });
          } else {
            setWallet(null);
          }
        } else {
          setWallet(null);
        }
      } catch (err) {
        console.error('Failed to fetch wallet:', err);
        setWallet(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchWallet();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        {!isModal && (
          <div>
            <h1 className="text-2xl font-bold">Wallet</h1>
            <p className="text-muted-foreground">Manage your Tempo wallet and passkey settings</p>
          </div>
        )}
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  // No wallet - show passkey creation
  if (!wallet?.tempoAddress) {
    return (
      <div className="max-w-2xl space-y-6">
        {!isModal && (
          <div>
            <h1 className="text-2xl font-bold">Wallet</h1>
            <p className="text-muted-foreground">Manage your Tempo wallet and passkey settings</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Create Your Wallet</CardTitle>
            <CardDescription>
              Your wallet is secured by a passkey (TouchID, FaceID, or security key)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasskeyManager wallet={wallet} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const walletWithAddress = {
    id: wallet.id,
    credentialID: wallet.credentialID,
    name: wallet.name,
    tempoAddress: wallet.tempoAddress,
    createdAt: wallet.createdAt,
  };

  // Modal mode - compact layout
  if (isModal) {
    return (
      <div className="space-y-4">
        <WalletHero wallet={walletWithAddress} isModal />
        <StatsRow stats={stats} isModal />
        <WalletTabs isModal />
      </div>
    );
  }

  // Full page mode
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">Manage your Tempo wallet and funds</p>
      </div>

      <WalletHero wallet={walletWithAddress} />
      <StatsRow stats={stats} />
      <WalletTabs />
    </div>
  );
}
