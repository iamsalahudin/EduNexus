'use client';

import { useState, useEffect } from 'react';

import { useSearchParams, useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import PasswordStrength from '@/components/ui/PasswordStrength';
import { resetPasswordApi } from '@/services/auth.service';
import Input from '@/components/ui/Input';

export default function ConfirmPasswordPage() {
  const search = useSearchParams();
  const email = search.get('email') || '';
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setSuccess('');
    if (!password || !confirm) return setErr('Fill both password fields');
    if (password !== confirm) return setErr('Passwords do not match');
    if (password.length < 8) return setErr('Choose a stronger password (min 8 chars)');
    setLoading(true);
    try {
      await resetPasswordApi({ email, password });
      setSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => router.push('/login'), 1400);
    } catch (err) {
      setErr(err?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // prevent direct access without email
  useEffect(() => {
    if (!email) router.push('/forgot-password');
  }, [email, router]);

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Set new password</h2>
        <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          Choose a strong password to secure your account
        </p>
      </div>

      {err && <div className="text-sm text-red-700 bg-red-50 dark:bg-transparent dark:text-red-400 p-2 rounded">{err}</div>}
      {success && <div className="text-sm text-green-700 bg-green-50 dark:bg-transparent dark:text-green-400 p-2 rounded">{success}</div>}

      <form onSubmit={submit} className="space-y-4">
          <Input
            name="password"
            type="password"
            label="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
          />

          <PasswordStrength password={password} />

          <Input
            name="confirm"
            type="password"
            label="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
          />

          <div className="w-full flex items-center justify-center text-center gap-1 mt-10">
          <Link href="/login" className="w-full py-2 bg-gray-600 rounded-md flex items-center justify-center text-center">
            Cancel
          </Link>
          <button type="submit" className="w-full py-2 btn-primary rounded-md flex items-center justify-center text-center" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
        </form>
    </div>
  );
}
