'use client';

import { useEffect, useMemo, useState } from 'react';
import { ButtonLink, Card, PageHeader, StatCard } from '@/components/ui';
import NotificationsManagementWorkspace from '@/components/notifications/NotificationsManagementWorkspace';
import notificationsService from '@/services/notificationsService';

export default function AdminNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ inbox: 0, unread: 0, requests: 0, broadcasts: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadMetrics() {
      try {
        setLoading(true);
        setError('');
        const [inboxRes, requestsRes, broadcastsRes] = await Promise.all([
          notificationsService.inbox(),
          notificationsService.listRequests(),
          notificationsService.listBroadcast(),
        ]);

        if (!mounted) return;

        const inboxItems = Array.isArray(inboxRes?.notifications)
          ? inboxRes.notifications
          : Array.isArray(inboxRes?.items)
            ? inboxRes.items
            : Array.isArray(inboxRes?.data)
              ? inboxRes.data
              : [];
        const requestItems = Array.isArray(requestsRes?.requests)
          ? requestsRes.requests
          : Array.isArray(requestsRes?.items)
            ? requestsRes.items
            : Array.isArray(requestsRes?.data)
              ? requestsRes.data
              : [];
        const broadcastItems = Array.isArray(broadcastsRes?.broadcasts)
          ? broadcastsRes.broadcasts
          : Array.isArray(broadcastsRes?.items)
            ? broadcastsRes.items
            : Array.isArray(broadcastsRes?.data)
              ? broadcastsRes.data
              : [];

        setMetrics({
          inbox: inboxItems.length,
          unread: inboxItems.filter((item) => !item?.read && !item?.isRead).length,
          requests: requestItems.length,
          broadcasts: broadcastItems.length,
        });
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error || 'Failed to load notification metrics.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMetrics();
    return () => {
      mounted = false;
    };
  }, []);

  const quickLinks = useMemo(() => ([
    { title: 'Send Notification', description: 'Broadcast a new message to a role, class, or specific users.', href: '/admin/notifications/send' },
    { title: 'History', description: 'Review previously sent announcements and delivery status.', href: '/admin/notifications/history' },
    { title: 'Class Alerts', description: 'Manage class-specific notification workflows.', href: '/admin/notifications/class' },
    { title: 'Requests', description: 'Review user help requests and respond from the inbox.', href: '/admin/notifications' },
  ]), []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Broadcast school-wide, role-based, or targeted notifications. Review and process user requests."
        right={(
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/admin/notifications/send" variant="primary">Send</ButtonLink>
            <ButtonLink href="/admin/notifications/history" variant="outline">History</ButtonLink>
          </div>
        )}
      />

      {error ? (
        <Card className="border border-red-200 bg-red-50 text-red-700">
          {error}
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Inbox" value={loading ? 'Loading...' : metrics.inbox} />
        <StatCard label="Unread" value={loading ? 'Loading...' : metrics.unread} />
        <StatCard label="Requests" value={loading ? 'Loading...' : metrics.requests} />
        <StatCard label="Broadcasts" value={loading ? 'Loading...' : metrics.broadcasts} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((link) => (
          <Card key={link.href}>
            <h3 className="text-lg font-semibold text-gray-900">{link.title}</h3>
            <p className="mt-2 text-sm text-gray-600">{link.description}</p>
            <div className="mt-4">
              <ButtonLink href={link.href} variant="outline">Open</ButtonLink>
            </div>
          </Card>
        ))}
      </div>

      <NotificationsManagementWorkspace
        title="Notifications Workspace"
        subtitle="Broadcast school-wide, role-based, or targeted notifications. Review and process user requests."
        roleBase="/admin"
        allowSystem
      />
    </div>
  );
}
