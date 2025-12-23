import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/auth.context';

export default function StudentLayout({ children }) {
  const { user } = useAuth();

  return <AppShell role="student" user={user}>{children}</AppShell>;
}
