import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/auth.context';

export default function FinanceLayout({ children }) {
  const { user } = useAuth();

  return <AppShell role="finance" user={user}>{children}</AppShell>;
}
