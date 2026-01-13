import { getRepoSettingsByName, canManageRepo } from '@/db/queries/repo-settings';
import { getSession } from '@/lib/auth/auth-server';
import { redirect } from 'next/navigation';
import { AutoClaim } from './_components/auto-claim';
import { ClaimResultBanner } from './_components/claim-result-banner';
import { SettingsLayout } from './_components/settings-layout';

interface SettingsPageProps {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<{ claimed?: string; error?: string }>;
}

/**
 * Repo settings page (protected)
 *
 * Only accessible by repo owner.
 * - Not logged in → redirect to login
 * - Logged in + repo not claimed → auto-trigger GitHub App install
 * - Logged in + not owner → redirect to repo page
 * - Logged in + owner → show settings
 */
export default async function SettingsPage({ params, searchParams }: SettingsPageProps) {
  const { owner, repo } = await params;
  const { claimed, error } = await searchParams;

  const session = await getSession();

  // Not logged in → redirect to login
  if (!session?.user) {
    redirect(`/login?callbackUrl=/${owner}/${repo}/settings`);
  }

  const repoSettings = await getRepoSettingsByName(owner, repo);

  // Repo not claimed → auto-trigger claim flow
  if (!repoSettings) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <AutoClaim owner={owner} repo={repo} />
        </div>
      </div>
    );
  }

  // Check permissions - must be repo owner or org owner
  const canManage = await canManageRepo(repoSettings.githubRepoId, session.user.id);
  if (!canManage) {
    redirect(`/${owner}/${repo}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <ClaimResultBanner claimed={claimed === 'true'} error={error} />
        <SettingsLayout
          githubRepoId={Number(repoSettings.githubRepoId)}
          owner={owner}
          repo={repo}
        />
      </div>
    </div>
  );
}
