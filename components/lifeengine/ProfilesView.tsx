"use client";

import { useMemo, useState } from "react";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { Profile } from "@/lib/types/profile";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { ProfileCard } from "./ProfileCard";
import { Button } from "@/components/ui/Button";

type ProfilesViewProps = {
  onCreate?: () => void;
  onEdit?: (profile: Profile) => void;
  onDelete?: (profile: Profile) => void;
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export function ProfilesView({ onCreate, onEdit, onDelete }: ProfilesViewProps) {
  const [search, setSearch] = useState("");
  const [flagFilter, setFlagFilter] = useState<string | null>(null);
  const { data, isLoading, error, mutate } = useProfiles({ suspense: false });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-700">
        Unable to load profiles right now.
        <Button variant="ghost" size="sm" className="ml-3" onClick={() => mutate()}>
          Retry
        </Button>
      </div>
    );
  }

  const profiles = data?.profiles ?? [];
  const availableFlags = Array.from(
    new Set(profiles.flatMap((profile) => profile.health?.flags ?? [])),
  ).slice(0, 6);

  const filteredProfiles = useMemo(() => {
    const query = normalizeSearch(search);
    return profiles.filter((profile) => {
      const matchesSearch =
        !query ||
        profile.name.toLowerCase().includes(query) ||
        profile.contact?.email?.toLowerCase().includes(query) ||
        profile.contact?.phone?.toLowerCase().includes(query);
      const matchesFlag = !flagFilter || (profile.health?.flags ?? []).includes(flagFilter);
      return matchesSearch && matchesFlag;
    });
  }, [profiles, search, flagFilter]);

  if (!profiles.length) {
    return (
      <EmptyState
        title="No profiles yet"
        description="Create your first member profile to start generating plans."
        actionLabel="New profile"
        onAction={onCreate}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:max-w-sm">
          <Input
            label="Search"
            placeholder="Search by name, email, phone…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {availableFlags.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500">Health flags:</span>
            <button
              type="button"
              onClick={() => setFlagFilter(null)}
              className="rounded-full px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              aria-pressed={flagFilter === null}
            >
              All
            </button>
            {availableFlags.map((flag) => (
              <button
                key={flag}
                type="button"
                onClick={() => setFlagFilter((current) => (current === flag ? null : flag))}
                className="rounded-full px-3 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                aria-pressed={flagFilter === flag}
                style={{
                  backgroundColor: flagFilter === flag ? "rgb(254 226 226)" : "transparent",
                  color: flagFilter === flag ? "rgb(190 18 60)" : "rgb(71 85 105)",
                }}
              >
                {flag}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {filteredProfiles.length ? (
        <div className="space-y-3">
          {filteredProfiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No profiles match your filters"
          description="Try adjusting search terms or removing flag filters."
          actionLabel="Clear filters"
          onAction={() => {
            setSearch("");
            setFlagFilter(null);
          }}
        />
      )}
    </div>
  );
}
