export default function ConfirmPassword(){
  return (
    <div className="card">
      <h2 className="text-lg font-semibold">Set New Password</h2>
      <form className="mt-4 space-y-3">
        <input type="password" name="password" placeholder="New password" required className="w-full border rounded px-3 py-2" />
        <input type="password" name="confirm" placeholder="Confirm password" required className="w-full border rounded px-3 py-2" />
        <button className="w-full py-2 btn-primary rounded">Save Password</button>
      </form>
    </div>
  )
}
