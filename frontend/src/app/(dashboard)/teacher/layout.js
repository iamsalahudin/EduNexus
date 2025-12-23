import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/context/auth.context';

export default function TeacherLayout({ children }) {
  const { user } = useAuth();

  return <AppShell role="teacher" user={user}>{children}</AppShell>;
}
