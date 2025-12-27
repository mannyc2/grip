import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { RouteModal } from '@/components/modal/route-modal';
import { SettingsModalShell } from '../../settings/_components/settings-modal-shell';
import { getSettingsLayoutData } from '../../settings/_lib/get-settings-layout-data';

/**
 * Modal layout for settings (intercepting route)
 *
 * Uses a modal-specific nav component with relative positioning
 * instead of the full-page sidebar which uses fixed viewport positioning.
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
    <RouteModal title="Settings">
      <div className="h-[70vh]">
        <SettingsModalShell user={data.user} organizations={data.organizations}>
          {children}
        </SettingsModalShell>
      </div>
    </RouteModal>
  );
}
