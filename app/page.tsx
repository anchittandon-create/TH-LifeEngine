export default function Home() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">TH+ LifeEngine</h1>
      <p className="text-lg text-[var(--muted)] mb-8">
        Personalised wellness planning with Gemini AI.
      </p>
      <a
        href="/lifeengine"
        className="inline-block px-6 py-3 bg-[var(--accent)] text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Get Started
      </a>
    </div>
  );
}
