export default function OTPVerification(){
  return (
    <div className="card">
      <h2 className="text-lg font-semibold">OTP Verification</h2>
      <p className="text-sm text-gray-600 mt-2">Enter the one-time password sent to your email.</p>
      <form className="mt-4 space-y-3">
        <input type="text" name="otp" placeholder="Enter OTP" required className="w-full border rounded px-3 py-2" />
        <div className="flex items-center justify-between">
          <button className="py-2 px-4 btn-primary rounded">Verify</button>
          <span className="text-sm text-gray-500">Resend in <strong>00:59</strong></span>
        </div>
      </form>
    </div>
  )
}
