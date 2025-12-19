'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface PendingLiabilitiesWarningProps {
  walletAddress: string;
}

/**
 * Warning banner for funders with insufficient balance for pending payments
 *
 * Shows when: wallet balance < total pending payment liabilities
 * Fetches: /api/wallet/liabilities (aggregated by token)
 * Fetches: /api/wallet/balance (current balance)
 * Action: Prompts user to fund wallet
 *
 * Pattern: Uses balance-display.tsx as reference for wallet-specific client component
 */
export function PendingLiabilitiesWarning({ walletAddress }: PendingLiabilitiesWarningProps) {
  const [liabilities, setLiabilities] = useState<
    Array<{
      tokenAddress: string;
      total: string;
    }>
  >([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch both balance and liabilities in parallel
        const [liabilitiesRes, balanceRes] = await Promise.all([
          fetch('/api/wallet/liabilities'),
          fetch(`/api/wallet/balance?address=${walletAddress}`),
        ]);

        if (liabilitiesRes.ok) {
          const data = await liabilitiesRes.json();
          setLiabilities(data.liabilities || []);
        }

        if (balanceRes.ok) {
          const data = await balanceRes.json();
          setBalance(Number(data.balance || 0));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [walletAddress]);

  // Don't show anything while loading or if no liabilities
  if (loading || liabilities.length === 0) {
    return null;
  }

  // Calculate total liabilities (assuming single token for now - USDC)
  const totalLiabilities = liabilities.reduce((sum, liability) => {
    return sum + BigInt(liability.total);
  }, BigInt(0));

  // Don't show if balance >= liabilities
  if (balance >= Number(totalLiabilities)) {
    return null;
  }

  // Format amounts for display (assuming 6 decimals for USDC)
  const formattedBalance = (balance / 1_000_000).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedLiabilities = (Number(totalLiabilities) / 1_000_000).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-6">
      <div className="flex items-start gap-4">
        <AlertCircle className="h-6 w-6 text-warning flex-shrink-0 mt-0.5" />
        <div className="space-y-3 flex-1">
          <h3 className="heading-4 text-warning">Pending Payment Obligations</h3>
          <p className="body-base text-muted-foreground">
            You have <span className="font-semibold">${formattedLiabilities} USDC</span> in pending
            payments, but only <span className="font-semibold">${formattedBalance} USDC</span> in
            your wallet. You won't be able to create new pending payments until you fund your
            wallet. When contributors claim, funds will be sent from your wallet automatically.
          </p>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/wallet/fund" />}
          >
            Fund Wallet
          </Button>
        </div>
      </div>
    </div>
  );
}
