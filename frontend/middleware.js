import { NextResponse } from 'next/server';

// Define protected paths and roles allowed
const protectedRoutes = {
  '/admin': ['admin'],
  '/principal': ['principal'],
  '/teacher': ['teacher'],
  '/student': ['student'],
  '/parent': ['parent'],
  '/hr': ['hr'],
  '/finance': ['finance'],
  '/reception': ['reception'],
};

// Helper to extract role from cookie or token
const getRoleFromCookie = (req) => {
  // Example: token stored as JWT in cookie "auth_token"
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;

  try {
    // decode payload only for role (without verification)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.role;
  } catch {
    return null;
  }
};

export function middleware(req) {
  const { pathname } = req.nextUrl;
  
  // Skip public paths
  if (pathname.startsWith('/login') || pathname.startsWith('/forgot-password') || pathname.startsWith('/otp-verification') || pathname.startsWith('/confirm-password')) {
    return NextResponse.next();
  }

  // Find matching protected route
  const route = Object.keys(protectedRoutes).find((path) => pathname.startsWith(path));
  if (!route) return NextResponse.next();

  const role = getRoleFromCookie(req);

  // Not logged in
  if (!role) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Role not allowed
  if (!protectedRoutes[route].includes(role)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  return NextResponse.next();
}

// Apply to all routes
export const config = {
  matcher: ['/admin/:path*', '/principal/:path*', '/teacher/:path*', '/student/:path*', '/parent/:path*', '/hr/:path*', '/finance/:path*', '/reception/:path*'],
};
