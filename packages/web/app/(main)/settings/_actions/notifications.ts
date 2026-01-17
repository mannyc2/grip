'use server';

import { getSession } from '@/lib/auth/auth-server';
import { updateNotificationPreferences } from '@/db/queries/notification-preferences';
import { revalidatePath } from 'next/cache';

export type NotificationPreferencesInput = {
  emailBountyFunded?: boolean;
  emailSubmissionReceived?: boolean;
  emailBountyCompleted?: boolean;
  emailPayoutReceived?: boolean;
  emailWeeklyDigest?: boolean;
  inAppEnabled?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  quietHoursTimezone?: string;
};

/**
 * Server action to update notification preferences.
 * Supports partial updates - only specified fields are changed.
 */
export async function updateNotificationPreferencesAction(
  data: NotificationPreferencesInput
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Simple validation - only allow known keys
  const allowedKeys = [
    'emailBountyFunded',
    'emailSubmissionReceived',
    'emailBountyCompleted',
    'emailPayoutReceived',
    'emailWeeklyDigest',
    'inAppEnabled',
    'quietHoursStart',
    'quietHoursEnd',
    'quietHoursTimezone',
  ] as const;

  const filteredData: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    if (allowedKeys.includes(key as (typeof allowedKeys)[number])) {
      filteredData[key] = data[key as keyof NotificationPreferencesInput];
    }
  }

  try {
    await updateNotificationPreferences(session.user.id, filteredData);
    revalidatePath('/settings/notifications');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update preferences' };
  }
}
