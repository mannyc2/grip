import { NotificationPreferencesForm } from '../notification-preferences-form';

export interface NotificationsContentProps {
  preferences: {
    emailBountyFunded: boolean;
    emailSubmissionReceived: boolean;
    emailBountyCompleted: boolean;
    emailPayoutReceived: boolean;
    emailWeeklyDigest: boolean;
    inAppEnabled: boolean;
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
    quietHoursTimezone: string | null;
  };
}

export function NotificationsContent({ preferences }: NotificationsContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notification Preferences</h1>
        <p className="text-muted-foreground">Manage how and when you receive notifications</p>
      </div>

      <NotificationPreferencesForm preferences={preferences} />
    </div>
  );
}
