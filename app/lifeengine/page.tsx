import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Welcome to LifeEngine
      </h1>
      <p className="mt-6 text-lg leading-8 text-gray-600">
        Your personalized health and wellness planner.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Link
          href="/lifeengine/create"
          className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Create a New Plan
        </Link>
        <Link
          href="/lifeengine/profiles"
          className="text-sm font-semibold leading-6 text-gray-900"
        >
          Manage Profiles <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
