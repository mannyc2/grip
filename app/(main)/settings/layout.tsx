import { redirect } from 'next/navigation';
import { SettingsSidebar } from './_components/settings-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getSettingsLayoutData } from './_lib/get-settings-layout-data';

export default async function SettingsLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const data = await getSettingsLayoutData();
  if (!data) {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <SettingsSidebar user={data.user} organizations={data.organizations} />
      <SidebarInset>
        <div className="flex-1 p-6">{children}</div>
      </SidebarInset>
      {modal}
    </SidebarProvider>
  );
}
