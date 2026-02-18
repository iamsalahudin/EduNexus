'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import OTPInput from '@/components/ui/OTPInput';
import { verifyOtpApi } from '@/services/auth.service';

export default function OTPVerificationPage() {
  const search = useSearchParams();
  const email = search.get('email') || '';
  const router = useRouter();

  const [otp, setOtp] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  // countdown
  const [seconds, setSeconds] = useState(30);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const resend = async () => {
    // call sendOtpApi if desired; here we just reset timer
    setSeconds(30);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!otp || otp.length < 3) return setErr('Please enter the OTP');
    setLoading(true);
    try {
      await verifyOtpApi({ email, otp });
      // go to confirm-password, keep email in query
      router.push(`/confirm-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setErr(err?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">OTP verification</h2>
        <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          OTP sent to {email || 'your email'}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {err && <div className="text-sm text-red-700 bg-red-50 dark:bg-transparent dark:text-red-400 p-2 rounded">{err}</div>}

        <div className="flex justify-center">
          <OTPInput length={4} value={otp} onChange={setOtp} />
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="text-gray-600 dark:text-gray-300">
            {seconds > 0 ? `Resend in ${seconds}s` : 'You can resend now'}
          </div>
          <button
            type="button"
            disabled={seconds > 0}
            onClick={resend}
            className="underline underline-offset-4 disabled:opacity-40"
            style={{ color: 'var(--color-primary)' }}
          >
            Resend
          </button>
        </div>

        <button className="w-full py-2 btn-primary rounded" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>
    </div>
  );
}
