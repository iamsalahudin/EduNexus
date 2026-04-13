'use client';

import NotificationsManagementWorkspace from '@/components/notifications/NotificationsManagementWorkspace';

export default function PrincipalNotificationsPage() {
  return (
    <NotificationsManagementWorkspace
      title="Notifications"
      subtitle="Broadcast school-wide, role-based, or targeted notifications. Review and process user requests."
      roleBase="/principal"
      allowSystem={false}
    />
  );
}
