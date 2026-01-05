import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSettingsLayoutData } from '../../settings/_lib/get-settings-layout-data';
import { SettingsModalWrapper } from './_components/settings-modal-wrapper';

/**
 * Modal layout for settings (intercepting route)
 *
 * Uses SettingsModalWrapper (client component) to check pathname and close
 * modal when navigating away from /settings/*. This is necessary because
 * Next.js layouts persist during soft navigation.
 *
 * Mobile users are redirected to the full page settings.
 */
export default async function SettingsModalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirect mobile users to full page settings
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);

  if (isMobile) {
    redirect('/settings');
  }

  const data = await getSettingsLayoutData();
  if (!data) {
    redirect('/login');
  }

  return (
    <SettingsModalWrapper user={data.user} organizations={data.organizations}>
      {children}
    </SettingsModalWrapper>
  );
}
