'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { FinanceCard } from '@/components/dashboard/cards/FinanceCard';
import Card from '@/components/ui/Card';

export function FeesSummary({ standalone = false, period = 'monthly' }) {
  const { finance, loading } = useDashboard({
    fetchSummary: false,
    fetchAttendance: false,
    fetchFinance: true,
    fetchClasses: false,
    fetchActivities: false,
    fetchNotifications: false
  });

  const data = period === 'monthly' ? finance?.summary : finance?.summary;

  const content = (
    <FinanceCard
      title={period === 'monthly' ? 'Monthly Fees' : 'Fee Overview'}
      data={{
        generated: data?.totalGenerated || 0,
        received: data?.totalReceived || 0,
        pending: (data?.totalGenerated || 0) - (data?.totalReceived || 0),
        percentage: data?.collectionPercentage || 0
      }}
      loading={loading}
    />
  );

  if (standalone) {
    return <Card>{content}</Card>;
  }

  return content;
}
