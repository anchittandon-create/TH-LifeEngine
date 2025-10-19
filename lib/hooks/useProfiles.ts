import { useApi } from "./useApi";
import type { Profile } from "@/lib/types/profile";

type ProfilesResponse = { profiles: Profile[] };

export function useProfiles(config?: Parameters<typeof useApi<ProfilesResponse>>[1]) {
  return useApi<ProfilesResponse>("/api/lifeengine/profiles/list", {
    suspense: true,
    ...config,
  });
}
