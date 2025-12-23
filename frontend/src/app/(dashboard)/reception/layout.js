import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/auth.context';

export default function ReceptionLayout({ children }) {
  const { user } = useAuth();

  return <AppShell role="reception" user={user}>{children}</AppShell>;
}
