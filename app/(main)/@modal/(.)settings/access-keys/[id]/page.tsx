import { getSession } from '@/lib/auth/auth-server';
import { getAccessKeyByIdForUser } from '@/db/queries/access-keys';
import { redirect, notFound } from 'next/navigation';
import { AccessKeyDetailContent } from '../../../../settings/_components/content/access-key-detail-content';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AccessKeyDetailModal({ params }: Props) {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;
  const accessKey = await getAccessKeyByIdForUser(id, session.user.id);

  if (!accessKey) {
    notFound();
  }

  const formattedKey = {
    id: accessKey.id,
    label: accessKey.label,
    backendWalletAddress: accessKey.backendWalletAddress,
    status: accessKey.status,
    createdAt: accessKey.createdAt,
    expiry: accessKey.expiry,
    limits: accessKey.limits as Record<string, { initial: string; remaining: string }>,
    lastUsedAt: accessKey.lastUsedAt,
  };

  return <AccessKeyDetailContent accessKey={formattedKey} variant="modal" />;
}
