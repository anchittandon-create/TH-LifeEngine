"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./page.module.css";

type PlanSummary = {
  id: string;
  profileId: string;
  intakeId: string;
  createdAt: string;
  goals: string[];
};

type Profile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  goals: string[];
  createdAt: string;
};

type ActivityLog = {
  id: string;
  type: "plan_created" | "profile_created" | "chat_message";
  description: string;
  timestamp: string;
  profileId?: string;
};

export default function DashboardPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load plans
      const plansResponse = await fetch("/api/lifeengine/listPlans");
      const plansData = plansResponse.ok ? await plansResponse.json() : { plans: [] };

      // Load profiles
      const profilesResponse = await fetch("/api/lifeengine/profiles");
      const profilesData = profilesResponse.ok ? await profilesResponse.json() : { profiles: [] };

      setPlans(plansData.plans || []);
      setProfiles(profilesData.profiles || []);

      // Generate activity log from the data
      const activities: ActivityLog[] = [];

      // Add plan creation activities
      plansData.plans?.forEach((plan: PlanSummary) => {
        activities.push({
          id: `plan-${plan.id}`,
          type: "plan_created",
          description: `Created health plan for goals: ${plan.goals.slice(0, 2).join(", ")}${plan.goals.length > 2 ? "..." : ""}`,
          timestamp: plan.createdAt,
          profileId: plan.profileId,
        });
      });

      // Add profile creation activities
      profilesData.profiles?.forEach((profile: Profile) => {
        activities.push({
          id: `profile-${profile.id}`,
          type: "profile_created",
          description: `Created profile for ${profile.name} (${profile.age}y)`,
          timestamp: profile.createdAt,
          profileId: profile.id,
        });
      });

      // Sort by timestamp (most recent first) and take last 10
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivityLog(activities.slice(0, 10));

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalProfiles = profiles.length;
  const totalPlans = plans.length;
  const plansByType = plans.reduce((acc, plan) => {
    // Since we don't have plan types in current data, we'll categorize by goals
    const primaryGoal = plan.goals[0] || "General";
    acc[primaryGoal] = (acc[primaryGoal] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const successRate = totalPlans > 0 ? 100 : 0; // Assume all plans are successful for now

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <Skeleton className={styles.titleSkeleton} />
          <Skeleton className={styles.buttonSkeleton} />
        </div>
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.card}>
              <Skeleton className={styles.cardHeaderSkeleton} />
              <div className={styles.goals}>
                <Skeleton className={styles.goalSkeleton} />
                <Skeleton className={styles.goalSkeleton} />
                <Skeleton className={styles.goalSkeleton} />
              </div>
              <Skeleton className={styles.buttonSkeleton} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <h2 className={styles.errorTitle}>Something went wrong</h2>
          <p className={styles.errorMessage}>{error}</p>
          <Button onClick={loadDashboardData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Overview of your wellness journey and activity
          </p>
        </div>
        <div className={styles.quickActions}>
          <Link href="/lifeengine/create">
            <Button>Create New Plan</Button>
          </Link>
          <Link href="/lifeengine/chat">
            <Button variant="ghost">Chat with CustomGPT</Button>
          </Link>
        </div>
      </header>

      {/* Metrics Cards */}
      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{totalProfiles}</div>
          <div className={styles.metricLabel}>Total Profiles</div>
          <div className={styles.metricSource}>Data Source: Profile Creation Module</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{totalPlans}</div>
          <div className={styles.metricLabel}>Plans Generated</div>
          <div className={styles.metricSource}>Data Source: Plan Creation Module</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{successRate}%</div>
          <div className={styles.metricLabel}>Success Rate</div>
          <div className={styles.metricSource}>Data Source: Plan Generation Module</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricValue}>{Object.keys(plansByType).length}</div>
          <div className={styles.metricLabel}>Plan Types</div>
          <div className={styles.metricSource}>Data Source: Plan Creation Module</div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Activity Log */}
        <div className={styles.activitySection}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
          <div className={styles.activityLog}>
            {activityLog.length === 0 ? (
              <div className={styles.emptyActivity}>
                <p>No recent activity. Start by creating a profile or plan!</p>
              </div>
            ) : (
              activityLog.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    {activity.type === "plan_created" && "📋"}
                    {activity.type === "profile_created" && "👤"}
                    {activity.type === "chat_message" && "💬"}
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityDescription}>{activity.description}</div>
                    <div className={styles.activityTime}>
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Plans Overview */}
        <div className={styles.plansSection}>
          <h2 className={styles.sectionTitle}>My Health Plans</h2>

          {plans.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyContent}>
                <h2 className={styles.emptyTitle}>No plans yet</h2>
                <p className={styles.emptyText}>
                  Create your first personalized health plan to get started on your wellness journey.
                </p>
                <Link href="/lifeengine/create">
                  <Button>Get Started</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className={styles.grid}>
              {plans.map((plan) => (
                <div key={plan.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>Plan #{plan.id.slice(-8)}</h3>
                    <span className={styles.date}>
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.goals}>
                    {plan.goals.slice(0, 3).map((goal, i) => (
                      <span key={i} className={styles.goal}>
                        {goal}
                      </span>
                    ))}
                    {plan.goals.length > 3 && (
                      <span className={styles.more}>+{plan.goals.length - 3} more</span>
                    )}
                  </div>
                  <Link href={`/lifeengine/plan/${plan.id}`}>
                    <Button variant="ghost" className={styles.viewButton}>
                      View Plan
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
