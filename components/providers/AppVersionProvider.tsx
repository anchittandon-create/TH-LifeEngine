"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AppVersion = "current" | "oss";

type AppVersionContextValue = {
  version: AppVersion;
  setVersion: (version: AppVersion) => void;
};

const DEFAULT_VERSION: AppVersion = "current";
const STORAGE_KEY = "th_lifeengine_app_version";

const AppVersionContext = createContext<AppVersionContextValue>({
  version: DEFAULT_VERSION,
  setVersion: () => {},
});

export function AppVersionProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState<AppVersion>(DEFAULT_VERSION);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as AppVersion | null;
    if (stored === "current" || stored === "oss") {
      setVersion(stored);
    }
  }, []);

  const handleVersionChange = (nextVersion: AppVersion) => {
    if (version === nextVersion) return;
    setVersion(nextVersion);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextVersion);
      window.location.reload();
    }
  };

  const value = useMemo(
    () => ({
      version,
      setVersion: handleVersionChange,
    }),
    [version]
  );

  return (
    <AppVersionContext.Provider value={value}>
      <div data-app-version={version}>{children}</div>
    </AppVersionContext.Provider>
  );
}

export function useAppVersion() {
  return useContext(AppVersionContext);
}
