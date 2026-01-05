import { redirect } from 'next/navigation';
import { SettingsSidebar } from './_components/settings-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
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
    <div className="h-[calc(100dvh-4rem)] overflow-hidden">
      <SidebarProvider
        className="h-full !min-h-0"
        style={{ '--sidebar-top': '4rem' } as React.CSSProperties}
      >
        <SettingsSidebar user={data.user} organizations={data.organizations} />
        <SidebarInset className="flex flex-col !overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <span className="font-semibold">Settings</span>
          </header>
          <div className="flex-1 min-h-0 overflow-auto p-4">{children}</div>
        </SidebarInset>
        {modal}
      </SidebarProvider>
    </div>
  );
}
