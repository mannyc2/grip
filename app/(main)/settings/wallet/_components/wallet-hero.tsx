'use client';

import { AddressDisplay } from '@/components/tempo/address-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowUpRight, Settings, Wallet as WalletIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { PasskeyManager } from '../../_components/passkey-manager';
import { FundContent } from './fund-content';
import { WithdrawContent } from './withdraw-content';

export interface WalletHeroProps {
  wallet: {
    id: string;
    name: string | null;
    tempoAddress: string;
    createdAt: string;
  };
  isModal?: boolean;
  onBalanceChange?: (balance: number) => void;
}

type ModalView = 'main' | 'fund' | 'withdraw' | 'settings';

export function WalletHero({ wallet, isModal = false, onBalanceChange }: WalletHeroProps) {
  const [balance, setBalance] = useState<number>(0.0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<ModalView>('main');

  const fetchBalance = useCallback(async () => {
    if (!wallet?.tempoAddress) return;
    try {
      const res = await fetch(`/api/wallet/balance?address=${wallet.tempoAddress}`);
      if (res.ok) {
        const data = await res.json();
        const newBalance = Number.parseFloat(data.formattedBalance ?? '0');
        setBalance(newBalance);
        onBalanceChange?.(newBalance);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [wallet?.tempoAddress, onBalanceChange]);

  useEffect(() => {
    if (wallet?.tempoAddress) {
      fetchBalance();
      const interval = setInterval(fetchBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchBalance, wallet?.tempoAddress]);

  // Modal mode: inline fund/withdraw/settings views
  if (isModal) {
    if (modalView === 'fund') {
      return (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setModalView('main')}
            className="mb-2 -ml-2"
          >
            ← Back
          </Button>
          <FundContent walletAddress={wallet.tempoAddress} />
        </div>
      );
    }

    if (modalView === 'withdraw') {
      return (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setModalView('main')}
            className="mb-2 -ml-2"
          >
            ← Back
          </Button>
          <WithdrawContent balance={balance} />
        </div>
      );
    }

    if (modalView === 'settings') {
      return (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setModalView('main')}
            className="mb-4 -ml-2"
          >
            ← Back
          </Button>
          <PasskeyManager wallet={wallet} />
        </div>
      );
    }

    // Main modal view - compact
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <BalanceSection
          balance={balance}
          isLoading={isLoadingBalance}
          walletAddress={wallet.tempoAddress}
        />
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => setModalView('fund')}>
            <WalletIcon className="h-4 w-4" />
            Fund
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setModalView('withdraw')}>
            <ArrowUpRight className="h-4 w-4" />
            Withdraw
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setModalView('settings')}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Full page mode - card wrapped
  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <BalanceSection
              balance={balance}
              isLoading={isLoadingBalance}
              walletAddress={wallet.tempoAddress}
            />
            <div className="flex gap-2">
              <Button size="lg" className="gap-2" onClick={() => setFundModalOpen(true)}>
                <WalletIcon className="h-4 w-4" />
                Fund
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => setWithdrawModalOpen(true)}
              >
                <ArrowUpRight className="h-4 w-4" />
                Withdraw
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => setSettingsModalOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fund Modal */}
      <Dialog open={fundModalOpen} onOpenChange={setFundModalOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader className="sr-only">
            <DialogTitle>Fund Your Wallet</DialogTitle>
          </DialogHeader>
          <FundContent walletAddress={wallet.tempoAddress} />
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader className="sr-only">
            <DialogTitle>Withdraw Funds</DialogTitle>
          </DialogHeader>
          <WithdrawContent balance={balance} />
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Wallet Settings</DialogTitle>
            <DialogDescription>Manage your passkey and wallet security</DialogDescription>
          </DialogHeader>
          <PasskeyManager wallet={wallet} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function BalanceSection({
  balance,
  isLoading,
  walletAddress,
}: {
  balance: number;
  isLoading: boolean;
  walletAddress: string;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">Balance</p>
      <div className="flex items-baseline gap-2">
        {isLoading ? (
          <span className="text-3xl font-bold text-muted-foreground animate-pulse">$---.--</span>
        ) : (
          <span className="text-3xl font-bold">${balance.toFixed(2)}</span>
        )}
        <span className="text-sm text-muted-foreground">USDC</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Address:</span>
        <AddressDisplay address={walletAddress} truncate />
      </div>
    </div>
  );
}
