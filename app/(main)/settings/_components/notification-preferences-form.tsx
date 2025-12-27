'use client';

import { useOptimistic, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Mail, Moon } from 'lucide-react';
import {
  updateNotificationPreferencesAction,
  type NotificationPreferencesInput,
} from '../_actions/notifications';

interface NotificationPreferencesFormProps {
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

type PreferenceKey = keyof NotificationPreferencesInput;

const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

export function NotificationPreferencesForm({ preferences }: NotificationPreferencesFormProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticPrefs, setOptimisticPrefs] = useOptimistic(preferences);

  async function handleToggle(key: PreferenceKey, value: boolean) {
    // Optimistic update
    setOptimisticPrefs((prev) => ({ ...prev, [key]: value }));

    startTransition(async () => {
      const result = await updateNotificationPreferencesAction({ [key]: value });
      if (!result.success) {
        // Revert on error - the page will revalidate with actual data
        console.error('Failed to update preference:', result.error);
      }
    });
  }

  async function handleQuietHoursChange(
    key: 'quietHoursStart' | 'quietHoursEnd' | 'quietHoursTimezone',
    value: string | null
  ) {
    setOptimisticPrefs((prev) => ({ ...prev, [key]: value }));

    startTransition(async () => {
      const result = await updateNotificationPreferencesAction({ [key]: value });
      if (!result.success) {
        console.error('Failed to update quiet hours:', result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>Choose which notifications you want to receive by email</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldLegend variant="label">Bounty Activity</FieldLegend>
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="emailBountyFunded">
                  <FieldContent>
                    <span className="font-medium">Bounty funded</span>
                    <FieldDescription>When someone funds a bounty you created</FieldDescription>
                  </FieldContent>
                </FieldLabel>
                <Switch
                  id="emailBountyFunded"
                  checked={optimisticPrefs.emailBountyFunded}
                  onCheckedChange={(checked) => handleToggle('emailBountyFunded', checked)}
                  disabled={isPending}
                />
              </Field>

              <Field orientation="horizontal">
                <FieldLabel htmlFor="emailSubmissionReceived">
                  <FieldContent>
                    <span className="font-medium">Submission received</span>
                    <FieldDescription>When someone submits work to your bounty</FieldDescription>
                  </FieldContent>
                </FieldLabel>
                <Switch
                  id="emailSubmissionReceived"
                  checked={optimisticPrefs.emailSubmissionReceived}
                  onCheckedChange={(checked) => handleToggle('emailSubmissionReceived', checked)}
                  disabled={isPending}
                />
              </Field>

              <Field orientation="horizontal">
                <FieldLabel htmlFor="emailBountyCompleted">
                  <FieldContent>
                    <span className="font-medium">Bounty completed</span>
                    <FieldDescription>
                      When a bounty you&apos;re involved in is completed
                    </FieldDescription>
                  </FieldContent>
                </FieldLabel>
                <Switch
                  id="emailBountyCompleted"
                  checked={optimisticPrefs.emailBountyCompleted}
                  onCheckedChange={(checked) => handleToggle('emailBountyCompleted', checked)}
                  disabled={isPending}
                />
              </Field>
            </FieldGroup>

            <FieldLegend variant="label" className="mt-6">
              Payouts
            </FieldLegend>
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="emailPayoutReceived">
                  <FieldContent>
                    <span className="font-medium">Payout received</span>
                    <FieldDescription>
                      When you receive a payout for completed work
                    </FieldDescription>
                  </FieldContent>
                </FieldLabel>
                <Switch
                  id="emailPayoutReceived"
                  checked={optimisticPrefs.emailPayoutReceived}
                  onCheckedChange={(checked) => handleToggle('emailPayoutReceived', checked)}
                  disabled={isPending}
                />
              </Field>
            </FieldGroup>

            <FieldLegend variant="label" className="mt-6">
              Digests
            </FieldLegend>
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="emailWeeklyDigest">
                  <FieldContent>
                    <span className="font-medium">Weekly summary</span>
                    <FieldDescription>A weekly digest of platform activity</FieldDescription>
                  </FieldContent>
                </FieldLabel>
                <Switch
                  id="emailWeeklyDigest"
                  checked={optimisticPrefs.emailWeeklyDigest}
                  onCheckedChange={(checked) => handleToggle('emailWeeklyDigest', checked)}
                  disabled={isPending}
                />
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>In-App Notifications</CardTitle>
          </div>
          <CardDescription>Control how notifications appear within the app</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="inAppEnabled">
                  <FieldContent>
                    <span className="font-medium">Enable notifications</span>
                    <FieldDescription>
                      Show notifications in the app notification center
                    </FieldDescription>
                  </FieldContent>
                </FieldLabel>
                <Switch
                  id="inAppEnabled"
                  checked={optimisticPrefs.inAppEnabled}
                  onCheckedChange={(checked) => handleToggle('inAppEnabled', checked)}
                  disabled={isPending}
                />
              </Field>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Quiet Hours</CardTitle>
          </div>
          <CardDescription>
            Pause notifications during specific hours. Leave empty to disable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldSet>
            <FieldGroup>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="quietHoursStart">Start time</FieldLabel>
                  <Input
                    id="quietHoursStart"
                    type="time"
                    value={optimisticPrefs.quietHoursStart || ''}
                    onChange={(e) =>
                      handleQuietHoursChange('quietHoursStart', e.target.value || null)
                    }
                    disabled={isPending}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="quietHoursEnd">End time</FieldLabel>
                  <Input
                    id="quietHoursEnd"
                    type="time"
                    value={optimisticPrefs.quietHoursEnd || ''}
                    onChange={(e) =>
                      handleQuietHoursChange('quietHoursEnd', e.target.value || null)
                    }
                    disabled={isPending}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="quietHoursTimezone">Timezone</FieldLabel>
                  <Select
                    value={optimisticPrefs.quietHoursTimezone || 'UTC'}
                    onValueChange={(value) => handleQuietHoursChange('quietHoursTimezone', value)}
                    disabled={isPending}
                  >
                    <SelectTrigger id="quietHoursTimezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <FieldDescription className="mt-2">
                Notifications during quiet hours will be queued and delivered when quiet hours end.
              </FieldDescription>
            </FieldGroup>
          </FieldSet>
        </CardContent>
      </Card>
    </div>
  );
}
