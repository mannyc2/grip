import { Card, CardContent } from '@/components/ui/card';
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
import { Key } from 'lucide-react';
import Link from 'next/link';
import { AccessKeyManager } from '../access-key-manager';

export interface AccessKey {
  id: string;
  label: string | null;
  backendWalletAddress: string | null;
  status: string;
  createdAt: string | null;
  expiry: number | null;
  limits: Record<string, { initial: string; remaining: string }>;
  lastUsedAt: string | null;
}

export interface AccessKeysContentProps {
  hasWallet: boolean;
  accessKeys: AccessKey[];
  credentialId: string | null;
}

export function AccessKeysContent({ hasWallet, accessKeys, credentialId }: AccessKeysContentProps) {
  if (!hasWallet) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Access Keys</h1>
          <p className="text-muted-foreground">Manage auto-pay authorization for bounty payouts</p>
        </div>

        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyMedia variant="icon">
                <Key />
              </EmptyMedia>
              <EmptyTitle>Wallet Required</EmptyTitle>
              <EmptyDescription>
                You need to create a wallet before you can set up access keys.{' '}
                <Link href="/settings/wallet" className="text-primary hover:underline">
                  Create wallet
                </Link>
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Access Keys</h1>
        <p className="text-muted-foreground">Manage auto-pay authorization for bounty payouts</p>
      </div>

      <AccessKeyManager initialKeys={accessKeys} credentialId={credentialId!} />
    </div>
  );
}
