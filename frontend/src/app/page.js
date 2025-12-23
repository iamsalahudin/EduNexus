export default function FullScreenThemeShowcase() {

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg text-fg transition-colors duration-500">
      <div className="z-10 p-5 text-center">
        <h1 className="mb-4 text-4xl font-bold">Welcome to EduNexus</h1>
        <p className="mb-8 text-lg">Your gateway to knowledge and learning.</p>
        <a
          href="/login"
          className="rounded bg-cta px-6 py-3 font-semibold text-white hover:bg-cta/90 transition"
        >
          lOGIN NOW
        </a>
      </div>
    </main>
  );
}
