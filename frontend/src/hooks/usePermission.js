import { ROLE_PERMISSIONS } from '@/constants/rolePermissions';
import { useAuth } from '@/context/auth.context';

export const usePermissions = () => {
  const { role } = useAuth();

  const hasPermission = (permission) => {
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.includes(permission);
  };

  return { hasPermission };
};
