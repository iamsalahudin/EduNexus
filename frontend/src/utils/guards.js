import { redirect } from 'next/navigation';

export const protectRoute = (user, allowedRoles = []) => {
  if (!user) redirect('/login');

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    redirect('/unauthorized');
  }
};
