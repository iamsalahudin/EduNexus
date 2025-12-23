import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/auth.context';

export default function HRLayout({ children }) {
  const { user } = useAuth();

  return <AppShell role="hr" user={user}>{children}</AppShell>;
}
