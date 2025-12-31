import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900  scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="card w-full max-w-3xl">
        <h1 className="text-2xl font-semibold">Welcome to EduNexus</h1>
        <p className="mt-2 text-sm text-gray-600">Open the app routes to view role dashboards and auth screens.</p>
        <Link href="/login" className="mt-4 inline-block px-4 py-2 btn-primary rounded">Get Started</Link>
      </div>
    </main>
  )
}
