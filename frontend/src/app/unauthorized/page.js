export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-fg">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
        <a href="/login" className="mt-4 inline-block text-primary hover:underline">
          Go to Login
        </a>
      </div>
    </div>
  );
}
