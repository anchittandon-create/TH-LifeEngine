"use client";

import { useAppVersion } from "@/components/providers/AppVersionProvider";

const OPTIONS = [
  {
    value: "current",
    label: "Current Application",
    helper: "Full feature set (OpenAI, Gemini, paid APIs)",
  },
  {
    value: "oss",
    label: "Free Open Source Version",
    helper: "Only free/open-source services",
  },
] as const;

export function AppVersionSwitcher() {
  const { version, setVersion } = useAppVersion();

  return (
    <div className="flex flex-col text-xs text-gray-600">
      <label htmlFor="app-version-select" className="font-semibold text-gray-700">
        Application Version
      </label>
      <div className="mt-1 flex items-center gap-3">
        <select
          id="app-version-select"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={version}
          onChange={(event) => setVersion(event.target.value as (typeof OPTIONS)[number]["value"])}
        >
          {OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="hidden text-xs text-gray-500 sm:inline">
          {OPTIONS.find((option) => option.value === version)?.helper}
        </span>
      </div>
    </div>
  );
}
