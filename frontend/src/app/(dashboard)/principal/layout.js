import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/auth.context';

export default function PrincipalLayout({ children }) {
  const { user } = useAuth();

  return <AppShell role="principal" user={user}>{children}</AppShell>;
}
