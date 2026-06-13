import Link from 'next/link'


export default function Home() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="min-h-[100dvh] grid grid-cols-1 lg:grid-cols-2">
        <section
          className="relative flex flex-col justify-between p-6 sm:p-10 text-white"
          style={{
            background:
              'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
          }}
        >
          <div>
            <div className="text-xs uppercase tracking-wider opacity-90">EduNexus</div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Campus ERP, simplified.
            </h1>
            <p className="mt-3 max-w-xl text-sm sm:text-base/7 opacity-90">
              Manage academics, fees, attendance, communication, and administration with a single secure platform.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/[0.10] border border-white/[0.15] p-4">
              <div className="text-sm font-medium">Secure Access</div>
              <div className="mt-1 text-xs opacity-[0.85]">Role-based dashboards</div>
            </div>
            <div className="rounded-xl bg-white/[0.10] border border-white/[0.15] p-4">
              <div className="text-sm font-medium">Unified Modules</div>
              <div className="mt-1 text-xs opacity-[0.85]">Fees, timetable, reports</div>
            </div>
            <div className="rounded-xl bg-white/[0.10] border border-white/[0.15] p-4">
              <div className="text-sm font-medium">Realtime Ready</div>
              <div className="mt-1 text-xs opacity-[0.85]">Chat & notifications</div>
            </div>
          </div>

          <div className="text-xs opacity-80">Sign in to continue</div>
        </section>

        <section className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            <div className="card p-5 sm:p-6">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-semibold tracking-tight">
                  Welcome to EduNexus ERP
                </div>
                <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Continue to the sign-in screen and access your role dashboard.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <Link href="/login" className="block w-full py-2 btn-primary rounded text-center">
                  Get Started
                </Link>
                <div className="text-center text-xs text-gray-600 dark:text-gray-300">
                  Use demo accounts from the Sign in page.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
