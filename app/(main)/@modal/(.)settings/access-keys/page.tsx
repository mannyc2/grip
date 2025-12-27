import { getAccessKeysByUser } from '@/db/queries/access-keys';
import { getPasskeysByUser } from '@/db/queries/passkeys';
import { getSession } from '@/lib/auth/auth-server';
import { AccessKeysContent } from '../../../settings/_components/content/access-keys-content';

export default async function AccessKeysModal() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  const passkeys = await getPasskeysByUser(session.user.id);
  const walletPasskey = passkeys.find((p) => p.tempoAddress) ?? null;

  if (!walletPasskey) {
    return <AccessKeysContent hasWallet={false} accessKeys={[]} credentialId={null} />;
  }

  const accessKeysRaw = await getAccessKeysByUser(session.user.id);
  const accessKeys = accessKeysRaw.map((key) => ({
    id: key.id,
    label: key.label,
    backendWalletAddress: key.backendWalletAddress,
    status: key.status,
    createdAt: key.createdAt,
    expiry: key.expiry ? Number(key.expiry) : null,
    limits: key.limits as Record<string, { initial: string; remaining: string }>,
    lastUsedAt: key.lastUsedAt,
  }));

  return (
    <AccessKeysContent
      hasWallet={true}
      accessKeys={accessKeys}
      credentialId={walletPasskey.credentialID}
    />
  );
}
