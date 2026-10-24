import React from 'react';
import type { Metadata } from 'next';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { getAdminDashboardData } from '@/lib/queries';
import { AdminDashboardClient } from '@/components/AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Protected Administrator Panel',
  description:
    'Authenticated server-side administrator panel for ROYAL MADRID data source management, manual override protection, and audit logging.',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const auth = await getAuthenticatedAdmin();

  if (!auth.authenticated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <AdminDashboardClient authenticated={false} />
      </div>
    );
  }

  const dashboardData = await getAdminDashboardData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminDashboardClient
        authenticated={true}
        username={auth.username}
        dashboardData={dashboardData}
      />
    </div>
  );
}
