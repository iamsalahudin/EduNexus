import Link from "next/link";

export default function ForgotPasswordPage(){
  return (
    <div className="card">
      <h2 className="text-lg font-semibold">Forgot Password</h2>
      <p className="text-sm text-gray-600 mt-2">Enter your email to receive OTP to reset password.</p>
      <form className="mt-4 space-y-3">
        <input type="email" name="email" placeholder="Email" required className="w-full border rounded px-3 py-2" />
        <div className="w-full py-2 btn-primary rounded flex items-center justify-center text-center">
        <Link href='/otp-verification' className="w-full">Send OTP</Link>
        </div>
      </form>
    </div>
  )
}
