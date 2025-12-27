import { AccessKeyDetail } from '../access-key-detail';

export interface AccessKeyData {
  id: string;
  label: string | null;
  backendWalletAddress: string | null;
  status: string;
  createdAt: string | null;
  expiry: bigint | null;
  limits: Record<string, { initial: string; remaining: string }>;
  lastUsedAt: string | null;
}

export interface AccessKeyDetailContentProps {
  accessKey: AccessKeyData;
  variant?: 'page' | 'modal';
}

export function AccessKeyDetailContent({
  accessKey,
  variant = 'page',
}: AccessKeyDetailContentProps) {
  return <AccessKeyDetail accessKey={accessKey} variant={variant} />;
}
