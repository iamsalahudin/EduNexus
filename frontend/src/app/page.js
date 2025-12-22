export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-52 bg-white dark:bg-black sm:items-start">
        <h1 className="mb-8 text-center text-5xl font-extrabold leading-tight text-zinc-900 dark:text-zinc-100 sm:text-6xl">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            EduNexus
          </span>
        </h1>
        <p className="mb-16 text-center text-lg text-zinc-700 dark:text-zinc-300 sm:text-xl">
          Welcome to SIMS, your gateway to Smart Institutue Management System. This platform is designed to simplify and streamline the way educational institutions handle student data, making it easier for administrators, teachers, and students to access and manage important information.
        </p>
      </main>
    </div>
  );
}
