import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasskeyManager } from '../passkey-manager';

export interface WalletContentProps {
  wallet: {
    id: string;
    name: string | null;
    tempoAddress: string | null;
    createdAt: string;
  } | null;
}

export function WalletContent({ wallet }: WalletContentProps) {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">Manage your Tempo wallet and passkey settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tempo Wallet</CardTitle>
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
