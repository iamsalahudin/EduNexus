import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/auth.context';

export default function ParentLayout({ children }) {
  const { user } = useAuth();

  return <AppShell role="parent" user={user}>{children}</AppShell>;
}
