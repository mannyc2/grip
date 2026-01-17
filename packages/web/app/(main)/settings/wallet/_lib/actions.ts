'use server';

import { getBountiesCreatedByUser, getCompletedBountiesByUser } from '@/db/queries/bounties';
import { getSession } from '@/lib/auth/auth-server';

export interface FundedBountyResult {
  bounty: {
    id: string;
    title: string;
    status: string;
    totalFunded: string;
    githubOwner: string;
    githubRepo: string;
  };
  repoSettings: {
    githubOwner: string;
    githubRepo: string;
  } | null;
  submissionCount: number;
}

export interface ContributionResult {
  bounty: {
    id: string;
    title: string;
    totalFunded: string;
    githubOwner: string;
    githubRepo: string;
  };
  repoSettings: {
    githubOwner: string;
    githubRepo: string;
  } | null;
  submission: {
    status: string;
    githubPrTitle: string | null;
  };
}

export async function getFundedBounties(): Promise<FundedBountyResult[]> {
  const session = await getSession();
  if (!session?.user) return [];

  const bounties = await getBountiesCreatedByUser(session.user.id);

  return bounties.map((b) => ({
    bounty: {
      id: b.bounty.id,
      title: b.bounty.title,
      status: b.bounty.status,
      totalFunded: b.bounty.totalFunded.toString(),
      githubOwner: b.bounty.githubOwner,
      githubRepo: b.bounty.githubRepo,
    },
    repoSettings: b.repoSettings
      ? {
          githubOwner: b.repoSettings.githubOwner,
          githubRepo: b.repoSettings.githubRepo,
        }
      : null,
    submissionCount: b.submissionCount,
  }));
}

export async function getContributions(): Promise<ContributionResult[]> {
  const session = await getSession();
  if (!session?.user) return [];

  const contributions = await getCompletedBountiesByUser(session.user.id);

  return contributions.map((c) => ({
    bounty: {
      id: c.bounty.id,
      title: c.bounty.title,
      totalFunded: c.bounty.totalFunded.toString(),
      githubOwner: c.bounty.githubOwner,
      githubRepo: c.bounty.githubRepo,
    },
    repoSettings: c.repoSettings
      ? {
          githubOwner: c.repoSettings.githubOwner,
          githubRepo: c.repoSettings.githubRepo,
        }
      : null,
    submission: {
      status: c.submission.status,
      githubPrTitle: c.submission.githubPrTitle,
    },
  }));
}
