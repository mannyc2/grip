'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function skipOnboarding() {
  (await cookies()).set('grip-onboarding-skipped', 'true', {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  });
  revalidatePath('/dashboard');
}
