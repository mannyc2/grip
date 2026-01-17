import { Navbar } from '@/components/layout/navbar';

/**
 * Main layout for authenticated app pages
 *
 * Provides:
 * - Navbar with auth state
 * - Modal slot for Instagram-style route interception
 */
export default function MainLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      {modal}
    </div>
  );
}
