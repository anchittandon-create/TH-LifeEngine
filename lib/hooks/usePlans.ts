import { useApi } from "./useApi";
import type { PlanListResponse } from "@/lib/types/plan";

export function usePlans(profileId?: string | null, config?: Parameters<typeof useApi<PlanListResponse>>[1]) {
  const url = profileId
    ? `/api/lifeengine/plan/listByProfile?profileId=${encodeURIComponent(profileId)}`
    : "/api/lifeengine/plan/listByProfile";
  return useApi<PlanListResponse>(url, { suspense: true, ...config });
}
