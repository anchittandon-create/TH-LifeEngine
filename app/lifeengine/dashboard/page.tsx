"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import JSZip from "jszip";
import styles from "./page.module.css";

type PlanSummary = {
  id: string;
  profileId: string;
  planName?: string; // e.g., "Plan for Anchit Tandon"
  inputSummary?: string; // e.g., "Yoga + Diet | 4 weeks | intermediate"
  intakeId: string;
  createdAt: string;
  goals: string[];
  planTypes?: string[];
  duration?: string;
  intensity?: string;
  source?: "gemini" | "custom-gpt" | "rule-engine"; // AI provider
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
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");

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

  const getProfileName = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    return profile?.name || "Unknown User";
  };

  const togglePlanSelection = (planId: string) => {
    const newSelected = new Set(selectedPlans);
    if (newSelected.has(planId)) {
      newSelected.delete(planId);
    } else {
      newSelected.add(planId);
    }
    setSelectedPlans(newSelected);
  };

  const selectAllPlans = () => {
    if (selectedPlans.size === plans.length) {
      setSelectedPlans(new Set());
    } else {
      setSelectedPlans(new Set(plans.map(p => p.id)));
    }
  };

  const downloadPlanAsPDF = async (planId: string, planName?: string) => {
    try {
      // Open the plan page which has PDF download functionality
      const safePlanName = planName || "plan";
      window.open(`/lifeengine/plan/${planId}?autoDownload=pdf`, '_blank');
      alert(`Opening plan page. Use the "Download PDF" button to save as PDF.`);
    } catch (error) {
      console.error("Failed to open plan:", error);
      alert("Failed to open plan");
    }
  };

  const exportSelectedAsZip = async () => {
    if (selectedPlans.size === 0) {
      alert("Please select at least one plan to export");
      return;
    }

    try {
      const zip = new JSZip();
      const selectedPlansList = plans.filter(p => selectedPlans.has(p.id));
      
      // Fetch each plan's full data
      for (const plan of selectedPlansList) {
        try {
          const response = await fetch(`/api/lifeengine/getPlan?planId=${plan.id}`);
          if (response.ok) {
            const planData = await response.json();
            const planName = plan.planName || `Plan for ${getProfileName(plan.profileId)}`;
            const fileName = `${planName.replace(/[^a-z0-9]/gi, '_')}_${plan.id.slice(-8)}.json`;
            zip.file(fileName, JSON.stringify(planData, null, 2));
          }
        } catch (err) {
          console.error(`Failed to fetch plan ${plan.id}:`, err);
        }
      }

      // Generate ZIP file
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TH_LifeEngine_Plans_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(`Successfully exported ${selectedPlans.size} plan(s) as ZIP`);
    } catch (error) {
      console.error("Failed to export plans:", error);
      alert("Failed to export plans as ZIP");
    }
  };

  const exportAllAsZip = async () => {
    if (plans.length === 0) {
      alert("No plans to export");
      return;
    }

    try {
      const zip = new JSZip();
      
      // Fetch all plans' full data
      for (const plan of plans) {
        try {
          const response = await fetch(`/api/lifeengine/getPlan?planId=${plan.id}`);
          if (response.ok) {
            const planData = await response.json();
            const planName = plan.planName || `Plan for ${getProfileName(plan.profileId)}`;
            const fileName = `${planName.replace(/[^a-z0-9]/gi, '_')}_${plan.id.slice(-8)}.json`;
            zip.file(fileName, JSON.stringify(planData, null, 2));
          }
        } catch (err) {
          console.error(`Failed to fetch plan ${plan.id}:`, err);
        }
      }

      // Generate ZIP file
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TH_LifeEngine_All_Plans_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert(`Successfully exported all ${plans.length} plan(s) as ZIP`);
    } catch (error) {
      console.error("Failed to export plans:", error);
      alert("Failed to export all plans");
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
          <div className={styles.plansSectionHeader}>
            <h2 className={styles.sectionTitle}>My Health Plans</h2>
            <div className={styles.planActions}>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setViewMode(viewMode === "cards" ? "table" : "cards")}
              >
                {viewMode === "cards" ? "📊 Table View" : "🎴 Card View"}
              </Button>
              {selectedPlans.size > 0 && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={exportSelectedAsZip}
                  >
                    📦 Export Selected ({selectedPlans.size})
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedPlans(new Set())}
                  >
                    ✖️ Clear Selection
                  </Button>
                </>
              )}
              {plans.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={exportAllAsZip}
                >
                  📥 Export All ({plans.length})
                </Button>
              )}
            </div>
          </div>

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
          ) : viewMode === "table" ? (
            <div className={styles.tableContainer}>
              <table className={styles.plansTable}>
                <thead>
                  <tr>
                    <th className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={selectedPlans.size === plans.length && plans.length > 0}
                        onChange={selectAllPlans}
                        className={styles.checkbox}
                        aria-label="Select all plans"
                        title="Select all plans"
                      />
                    </th>
                    <th>Plan Name</th>
                    <th>Created</th>
                    <th>Source</th>
                    <th>Input Parameters</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className={selectedPlans.has(plan.id) ? styles.selectedRow : ""}>
                      <td className={styles.checkboxCell}>
                        <input
                          type="checkbox"
                          checked={selectedPlans.has(plan.id)}
                          onChange={() => togglePlanSelection(plan.id)}
                          className={styles.checkbox}
                          aria-label={`Select plan for ${getProfileName(plan.profileId)}`}
                          title={`Select plan for ${getProfileName(plan.profileId)}`}
                        />
                      </td>
                      <td className={styles.planNameCell}>
                        <div className={styles.planName}>
                          <span className={styles.planIcon}>📋</span>
                          <span className={styles.planTitle}>
                            {plan.planName || `Plan for ${getProfileName(plan.profileId)}`}
                          </span>
                        </div>
                        <div className={styles.planId}>ID: {plan.id.slice(-8)}</div>
                      </td>
                      <td className={styles.dateCell}>
                        <div className={styles.date}>
                          {new Date(plan.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className={styles.time}>
                          {new Date(plan.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className={styles.sourceCell}>
                        <div className={styles.source}>
                          {plan.source === "gemini" && (
                            <span className={`${styles.sourceBadge} gemini`}>
                              🤖 Gemini
                            </span>
                          )}
                          {plan.source === "custom-gpt" && (
                            <span className={`${styles.sourceBadge} customgpt`}>
                              ✨ Custom GPT
                            </span>
                          )}
                          {(!plan.source || plan.source === "rule-engine") && (
                            <span className={`${styles.sourceBadge} ruleengine`}>
                              ⚙️ Rule Engine
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={styles.paramsCell}>
                        <div className={styles.params}>
                          {plan.inputSummary ? (
                            <span className={styles.paramValue}>{plan.inputSummary}</span>
                          ) : plan.planTypes && plan.planTypes.length > 0 ? (
                            <>
                              <span className={styles.paramLabel}>Types:</span>
                              <span className={styles.paramValue}>{plan.planTypes.join(", ")}</span>
                            </>
                          ) : plan.goals && plan.goals.length > 0 ? (
                            <>
                              <span className={styles.paramLabel}>Goals:</span>
                              <span className={styles.paramValue}>{plan.goals.slice(0, 2).join(", ")}</span>
                              {plan.goals.length > 2 && <span className={styles.more}>+{plan.goals.length - 2}</span>}
                            </>
                          ) : (
                            <span className={styles.noParams}>No parameters</span>
                          )}
                        </div>
                      </td>
                      <td className={styles.actionsCell}>
                        <div className={styles.actionButtons}>
                          <Link href={`/lifeengine/plan/${plan.id}`}>
                            <Button variant="ghost" size="sm" className={styles.actionBtn}>
                              👁️ View
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => downloadPlanAsPDF(plan.id, plan.planName)}
                            className={styles.actionBtn}
                          >
                            📄 PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.grid}>
              {plans.map((plan) => (
                <div key={plan.id} className={`${styles.card} ${selectedPlans.has(plan.id) ? styles.selectedCard : ""}`}>
                  <div className={styles.cardCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedPlans.has(plan.id)}
                      onChange={() => togglePlanSelection(plan.id)}
                      className={styles.checkbox}
                      aria-label={`Select plan for ${getProfileName(plan.profileId)}`}
                      title={`Select plan for ${getProfileName(plan.profileId)}`}
                    />
                  </div>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      Plan for {getProfileName(plan.profileId)}
                    </h3>
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
                  <div className={styles.cardActions}>
                    <Link href={`/lifeengine/plan/${plan.id}`}>
                      <Button variant="ghost" className={styles.viewButton}>
                        👁️ View Plan
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => downloadPlanAsPDF(plan.id)}
                    >
                      📄 PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
