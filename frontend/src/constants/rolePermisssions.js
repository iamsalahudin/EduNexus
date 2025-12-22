import { Role } from './roles';
import { PERMISSIONS } from './permissions';

export const ROLE_PERMISSIONS = {
  [Role.ADMIN]: Object.values(PERMISSIONS),
  [Role.PRINCIPAL]: [
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_REPORTS,
  ],
  [Role.TEACHER]: [
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_ATTENDANCE,
  ],
};
