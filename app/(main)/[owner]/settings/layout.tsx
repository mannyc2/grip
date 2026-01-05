import { redirect } from 'next/navigation';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { OrgSettingsSidebar } from './_components/org-settings-sidebar';
import { getOrgSettingsLayoutData } from './_lib/get-org-settings-layout-data';

interface OrgSettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ owner: string }>;
}

export default async function OrgSettingsLayout({ children, params }: OrgSettingsLayoutProps) {
  const { owner } = await params;
  const data = await getOrgSettingsLayoutData(owner);

  if (!data) {
    // Not authenticated - redirect to login
    redirect(`/login?callbackUrl=/${owner}/settings`);
  }

  // Layout data exists means user is authenticated and is a member
  // Non-members are handled by returning null from getOrgSettingsLayoutData

  return (
    <div className="h-[calc(100dvh-4rem)] overflow-hidden">
      <SidebarProvider
        className="h-full !min-h-0"
        style={{ '--sidebar-top': '4rem' } as React.CSSProperties}
      >
        <OrgSettingsSidebar organization={data.organization} context={data.context} />
        <SidebarInset className="flex flex-col !overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <span className="font-semibold">{data.organization.name} Settings</span>
          </header>
          <div className="flex-1 min-h-0 overflow-auto p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
