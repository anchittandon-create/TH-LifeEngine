export type PlanSummary = {
  planId: string;
  profileId: string;
  days: number;
  confidence: number;
  warnings: string[];
  createdAt?: string;
  planJSON?: any;
};

export type PlanListResponse = {
  plans: PlanSummary[];
};
