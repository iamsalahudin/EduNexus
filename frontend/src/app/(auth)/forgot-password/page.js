"use client";

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { sendOtpApi } from '@/services/auth.service';

export default function ForgotPasswordPage(){
  const search = useSearchParams();
  const router = useRouter();
  const initialUsername = search.get('username') || '';
  const initialEmail = search.get('email') || '';

  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setErr('');
    if (!username || !email) return setErr('Provide username and email');
    setLoading(true);
    try {
      await sendOtpApi({ username, email });
      router.push(`/otp-verification?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.error || err?.message || '';
      const isMailAuthFailure = status === 502 || /smtp|email authentication failed|username and password not accepted/i.test(message);

      if (isMailAuthFailure) {
        setErr('We could not send the OTP email right now. Please verify the mail server settings or try again later.');
      } else {
        setErr(message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Forgot password</h2>
        <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          Enter your username and account email to receive an OTP to reset your password.
        </p>
      </div>

      {err && <div className="text-sm text-red-700 bg-red-50 dark:bg-transparent dark:text-red-400 p-2 rounded">{err}</div>}

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" name="username" placeholder="username" required className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" name="email" placeholder="you@school.edu" required className="w-full border rounded px-3 py-2" />
        </div>

        <div className="w-full py-2 btn-primary rounded flex items-center justify-center text-center">
          <button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send OTP'}</button>
        </div>
      </form>
    </div>
  )
}
