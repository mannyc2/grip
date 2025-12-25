'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { authClient } from '@/lib/auth/auth-client';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { GitHubOrgPicker } from './github-org-picker';
import { OrganizationTypeSelector } from './organization-type-selector';
import { StandaloneOrgForm } from './standalone-org-form';

/**
 * CreateOrganizationModal - Multi-step organization creation flow
 *
 * Steps:
 * 1. select-type: Choose GitHub-linked or standalone
 * 2. github-picker: Select GitHub org (if GitHub chosen)
 * 2. standalone-form: Enter name/slug (if standalone chosen)
 *
 * State machine:
 * - Step transitions via button callbacks
 * - Back buttons allow navigation without closing
 * - Success callback refreshes org list
 * - Auto-resets to step 1 on close
 */

type CreateOrganizationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

type Step = 'select-type' | 'github-picker' | 'standalone-form';

export function CreateOrganizationModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrganizationModalProps) {
  const [step, setStep] = useState<Step>('select-type');
  const [error, setError] = useState<string | null>(null);

  // Reset to first step when modal closes
  function handleOpenChange(open: boolean) {
    onOpenChange(open);
    if (!open) {
      setTimeout(() => {
        setStep('select-type');
        setError(null);
      }, 300);
    }
  }

  // Step 1: Type selection handler
  function handleSelectType(type: 'github' | 'standalone') {
    setError(null); // Clear error when changing steps
    if (type === 'github') {
      setStep('github-picker');
    } else {
      setStep('standalone-form');
    }
  }

  // Step 2a: GitHub org selection handler
  async function handleGitHubOrgSelect(githubOrg: {
    id: number;
    login: string;
    avatar_url: string;
    name: string | null;
  }) {
    try {
      setError(null);

      // Create organization linked to GitHub
      const result = await authClient.organization.create({
        name: githubOrg.name || githubOrg.login,
        slug: githubOrg.login.toLowerCase(),
        logo: githubOrg.avatar_url,
        githubOrgId: githubOrg.id.toString(),
        githubOrgLogin: githubOrg.login,
        syncMembership: true,
      });

      // Set as active - triggers switcher refetch via session change
      if (result.data?.id) {
        await authClient.organization.setActive({
          organizationId: result.data.id,
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create GitHub-linked org:', error);
      setError('Failed to create organization. Please try again.');
    }
  }

  // Step 2b: Standalone form submission handler
  async function handleStandaloneSubmit(data: { name: string; slug: string }) {
    try {
      setError(null);

      const result = await authClient.organization.create({
        name: data.name,
        slug: data.slug,
        syncMembership: false,
      });

      // Set as active - triggers switcher refetch via session change
      if (result.data?.id) {
        await authClient.organization.setActive({
          organizationId: result.data.id,
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create standalone org:', error);
      setError('Failed to create organization. Please try again.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'select-type' && 'Create Organization'}
            {step === 'github-picker' && 'Select GitHub Organization'}
            {step === 'standalone-form' && 'Organization Details'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select-type' && 'Choose how to create your organization'}
            {step === 'github-picker' && 'Select an organization you admin on GitHub'}
            {step === 'standalone-form' && 'Enter your organization details'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="body-sm text-destructive">{error}</p>
          </div>
        )}

        {step === 'select-type' && <OrganizationTypeSelector onSelectType={handleSelectType} />}

        {step === 'github-picker' && (
          <GitHubOrgPicker onSelect={handleGitHubOrgSelect} onBack={() => setStep('select-type')} />
        )}

        {step === 'standalone-form' && (
          <StandaloneOrgForm
            onSubmit={handleStandaloneSubmit}
            onBack={() => setStep('select-type')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
