import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/auth.context';

export default function AdminLayout({ children }) {
  const { user } = useAuth();

  return <AppShell role="admin" user={user}>{children}</AppShell>;
}
