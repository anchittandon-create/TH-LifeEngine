"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Profile } from "@/lib/types/profile";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";

type ProfileCardProps = {
  profile: Profile;
  onEdit?: (profile: Profile) => void;
  onDelete?: (profile: Profile) => void;
};

function getSexLabel(sex?: string) {
  switch (sex) {
    case "M":
      return "Male";
    case "F":
      return "Female";
    case "Other":
      return "Other";
    default:
      return "—";
  }
}

export function ProfileCard({ profile, onEdit, onDelete }: ProfileCardProps) {
  const flags = profile.health?.flags ?? [];
  const allergies = profile.health?.allergies ?? [];
  const age = profile.demographics?.age;
  const sex = profile.demographics?.sex;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{profile.name}</h3>
          <p className="text-xs text-slate-500">
            {profile.contact?.location ?? "Location —"} ·{" "}
            {profile.createdAt ? formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true }) : "Synced just now"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip label={age ? `${age} yrs` : "Age —"} />
          <Chip label={getSexLabel(sex)} />
          {profile.lifestyle?.primaryGoal ? <Chip label={profile.lifestyle.primaryGoal} tone="info" /> : null}
        </div>
      </header>

      <div className="grid gap-3 text-xs text-slate-600 md:grid-cols-2">
        <div>
          <p className="font-medium text-slate-700">Contact</p>
          <p>Email: {profile.contact?.email ?? "—"}</p>
          <p>Phone: {profile.contact?.phone ?? "—"}</p>
        </div>
        <div>
          <p className="font-medium text-slate-700">Health flags</p>
          {flags.length ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {flags.map((flag) => (
                <Chip key={flag} label={flag} tone="warn" />
              ))}
            </div>
          ) : (
            <p>None reported</p>
          )}
        </div>
        <div>
          <p className="font-medium text-slate-700">Dietary notes</p>
          {allergies.length ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {allergies.map((item) => (
                <Chip key={item} label={item} tone="warn" />
              ))}
            </div>
          ) : (
            <p>Allergies not recorded</p>
          )}
        </div>
        <div>
          <p className="font-medium text-slate-700">Lifestyle</p>
          <p>Activity: {profile.lifestyle?.activityLevel ?? "—"}</p>
          <p>Time zone: {profile.lifestyle?.timeZone ?? "—"}</p>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/lifeengine/create?profileId=${profile.id}`}>Create plan</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit?.(profile)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete?.(profile)}>
            Delete
          </Button>
        </div>
        <p className="text-[10px] uppercase tracking-wide text-slate-400">ID: {profile.id}</p>
      </footer>
    </article>
  );
}
