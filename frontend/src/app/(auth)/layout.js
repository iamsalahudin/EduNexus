export default function AuthLayout({ children }) {
  return (
    <div className="min-h-[100dvh] overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="min-h-[100dvh] grid grid-cols-1 lg:grid-cols-2">
        <div
          className="hidden lg:flex flex-col justify-between p-10 text-white bg-auth dark:bg-auth-dark"
        >
          <div>
            <div className="text-2xl font-semibold tracking-tight">EduNexus ERP</div>
            <div className="mt-2 max-w-md text-sm/6 opacity-90">
              Secure access to academics, administration, and communication — in one place.
            </div>
          </div>

          <div className="text-xs opacity-80">Powered by your <b>EduNexus Innovators</b></div>
        </div>

        <div className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            <div className="mb-4 lg:hidden text-center">
              <div className="text-xl font-semibold">EduNexus ERP</div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                Sign in to continue
              </div>
            </div>

            <div className="card p-5 sm:p-6 max-h-[calc(100dvh-2rem)] overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
