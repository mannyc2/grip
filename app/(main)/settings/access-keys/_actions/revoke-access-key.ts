'use server';

import { getSession } from '@/lib/auth/auth-server';
import { getAccessKeyByIdForUser } from '@/db/queries/access-keys';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Server action to revoke an access key.
 * Validates ownership before revoking.
 */
export async function revokeAccessKeyAction(keyId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  // Verify ownership before revoking
  const accessKey = await getAccessKeyByIdForUser(keyId, session.user.id);
  if (!accessKey) {
    return { error: 'Access key not found' };
  }

  if (accessKey.status !== 'active') {
    return { error: 'Access key is not active' };
  }

  // Call the existing API endpoint to revoke
  const res = await fetch(`/api/auth/tempo/access-keys/${keyId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'User revoked from settings' }),
  });

  if (!res.ok) {
    const data = await res.json();
    return { error: data.error || 'Failed to revoke access key' };
  }

  revalidatePath('/settings/access-keys');
  redirect('/settings/access-keys');
}
