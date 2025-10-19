export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Welcome to TH+ LifeEngine</h1>
      <p className="text-[var(--muted)] mb-6">
        Create personalised wellness plans with AI-powered insights.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="/lifeengine/profiles"
          className="block p-6 bg-[var(--card)] border border-[var(--border)] rounded-md hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold mb-2">Profiles</h2>
          <p className="text-[var(--muted)]">Manage your wellness profiles.</p>
        </a>
        <a
          href="/lifeengine/create"
          className="block p-6 bg-[var(--card)] border border-[var(--border)] rounded-md hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold mb-2">Create Plan</h2>
          <p className="text-[var(--muted)]">Generate a new wellness plan.</p>
        </a>
        <a
          href="/lifeengine/dashboard"
          className="block p-6 bg-[var(--card)] border border-[var(--border)] rounded-md hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold mb-2">Dashboard</h2>
          <p className="text-[var(--muted)]">View your plans and progress.</p>
        </a>
      </div>
    </div>
  );
}
