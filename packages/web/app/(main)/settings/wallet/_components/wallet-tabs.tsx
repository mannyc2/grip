'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useState, useTransition } from 'react';
import {
  getContributions,
  getFundedBounties,
  type ContributionResult,
  type FundedBountyResult,
} from '../_lib/actions';
import { ContributionsTab } from './contributions-tab';
import { FundedTab } from './funded-tab';

type WalletTab = 'funded' | 'contributions';

interface TabData {
  funded?: FundedBountyResult[];
  contributions?: ContributionResult[];
}

interface WalletTabsProps {
  isModal?: boolean;
}

export function WalletTabs({ isModal = false }: WalletTabsProps) {
  const [activeTab, setActiveTab] = useState<WalletTab>('funded');
  const [tabData, setTabData] = useState<TabData>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fetchTabData = useCallback(
    (tab: WalletTab) => {
      // Skip if already loaded
      if (tabData[tab] !== undefined) return;

      setError(null);

      startTransition(async () => {
        try {
          if (tab === 'funded') {
            const data = await getFundedBounties();
            setTabData((prev) => ({ ...prev, funded: data }));
          } else {
            const data = await getContributions();
            setTabData((prev) => ({ ...prev, contributions: data }));
          }
        } catch (err) {
          console.error(`Failed to fetch ${tab}:`, err);
          setError('Failed to load data');
        }
      });
    },
    [tabData]
  );

  // Fetch data when tab changes
  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as WalletTab)}
      className={cn(!isModal && 'mt-6')}
    >
      <TabsList variant="line">
        <TabsTrigger value="funded">Funded</TabsTrigger>
        <TabsTrigger value="contributions">Contributions</TabsTrigger>
      </TabsList>

      <TabsContent value="funded" className="pt-4">
        <FundedTab
          bounties={tabData.funded ?? []}
          isLoading={isPending && activeTab === 'funded' && !tabData.funded}
          error={activeTab === 'funded' ? error : null}
          isModal={isModal}
        />
      </TabsContent>

      <TabsContent value="contributions" className="pt-4">
        <ContributionsTab
          contributions={tabData.contributions ?? []}
          isLoading={isPending && activeTab === 'contributions' && !tabData.contributions}
          error={activeTab === 'contributions' ? error : null}
          isModal={isModal}
        />
      </TabsContent>
    </Tabs>
  );
}
