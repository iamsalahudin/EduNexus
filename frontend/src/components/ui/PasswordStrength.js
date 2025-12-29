'use client';
import { useMemo } from 'react';

function scorePassword(pw = '') {
  let score = 0;
  if (!pw) return 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0..4
}

export default function PasswordStrength({ password }) {
  const score = useMemo(() => scorePassword(password), [password]);
  const labels = ['Very weak', 'Weak', 'Okay', 'Good', 'Strong'];
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-primary',
    'bg-cta',
  ];
  return (
    <div className="mt-2">
      <div className="h-2 w-full bg-neutral-200 rounded overflow-hidden">
        <div
          className={`h-full ${colors[score]} transition-all`}
          style={{ width: `${(score / 4) * 100}%` }}
          aria-hidden
        />
      </div>
      <div className="mt-1 text-xs text-muted">{labels[score]}</div>
    </div>
  );
}