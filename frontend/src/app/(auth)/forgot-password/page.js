'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage('OTP sent to your email.');
    } catch {
      setError('Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-center text-fg mb-2">
          Forgot Password
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          Enter your email to receive OTP
        </p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-100 p-2 rounded">{error}</div>
        )}
        {message && (
          <div className="mb-4 text-sm text-green-600 bg-green-100 p-2 rounded">{message}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cta text-white py-2 rounded-md hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      </div>
    </div>
  );
}
