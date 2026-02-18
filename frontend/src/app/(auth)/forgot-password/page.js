import Link from "next/link";

export default function ForgotPasswordPage(){
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Forgot password</h2>
        <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          Enter your email to receive an OTP to reset your password.
        </p>
      </div>

      <form className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input type="email" name="email" placeholder="you@school.edu" required className="w-full border rounded px-3 py-2" />
        </div>

        <div className="w-full py-2 btn-primary rounded flex items-center justify-center text-center">
          <Link href='/otp-verification' className="w-full">Send OTP</Link>
        </div>
      </form>
    </div>
  )
}
