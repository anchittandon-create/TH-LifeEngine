"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import PlanPreview from "@/app/components/PlanPreview";
import type { LifeEnginePlan } from "@/app/types/lifeengine";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from "./page.module.css";

// Old format from rule engine
type RulePlan = {
  id: string;
  profileId: string;
  intakeId: string;
  days: {
    date: string;
    activities: {
      type: string;
      name: string;
      duration: number;
      description: string;
    }[];
    meals: {
      type: string;
      name: string;
      calories: number;
      description: string;
    }[];
  }[];
};

type Props = {
  params: { id: string };
};

export default function PlanDetailPage({ params }: Props) {
  const [rulePlan, setRulePlan] = useState<RulePlan | null>(null);
  const [customGptPlan, setCustomGptPlan] = useState<LifeEnginePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const planRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPlan();
  }, [params.id]);

  const loadPlan = async () => {
    try {
      // Try loading as LifeEnginePlan first (CustomGPT format)
      const detailResponse = await fetch(`/api/lifeengine/plan/detail?planId=${params.id}`);
      if (detailResponse.ok) {
        const detailData = await detailResponse.json();
        if (detailData.plan && detailData.plan.weekly_schedule) {
          setCustomGptPlan(detailData.plan);
          setLoading(false);
          return;
        }
      }

      // Fall back to old rule engine format
      const response = await fetch(`/api/lifeengine/getPlan?id=${params.id}`);
      if (!response.ok) throw new Error("Failed to load plan");
      const data = await response.json();
      setRulePlan(data.plan);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!planRef.current) return;
    if (!rulePlan && !customGptPlan) return;

    setDownloading(true);
    try {
      const canvas = await html2canvas(planRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const planId = rulePlan?.id || params.id;
      pdf.save(`TH_LifeEngine_Plan_${planId.slice(-8)}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <Skeleton className={styles.titleSkeleton} />
            <Skeleton className={styles.subtitleSkeleton} />
          </div>
          <Skeleton className={styles.buttonSkeleton} />
        </header>
        <div className={styles.days}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={styles.day}>
              <Skeleton className={styles.dayHeaderSkeleton} />
              <div className={styles.section}>
                <Skeleton className={styles.sectionTitleSkeleton} />
                <div className={styles.items}>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className={styles.item}>
                      <Skeleton className={styles.itemHeaderSkeleton} />
                      <Skeleton className={styles.itemTitleSkeleton} />
                      <Skeleton className={styles.itemTextSkeleton} />
                    </div>
                  ))}
                </div>
              </div>
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
          <h2 className={styles.errorTitle}>Unable to load plan</h2>
          <p className={styles.errorMessage}>{error}</p>
          <div className={styles.errorActions}>
            <Button onClick={loadPlan}>Try Again</Button>
            <Link href="/lifeengine/dashboard">
              <Button variant="ghost">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!rulePlan && !customGptPlan) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <h2 className={styles.errorTitle}>Plan not found</h2>
          <p className={styles.errorMessage}>The requested plan could not be found.</p>
          <Link href="/lifeengine/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // If we have a CustomGPT plan with new format, use PlanPreview
  if (customGptPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-10">
        <div className="max-w-5xl mx-auto px-6">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Personalized Health Plan</h1>
              <p className="text-gray-600 mt-1">Generated with CustomGPT</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={downloadPDF}
                disabled={downloading}
              >
                {downloading ? "Generating PDF..." : "📄 Download PDF"}
              </Button>
              <Link href="/lifeengine/dashboard">
                <Button variant="ghost">← Back to Dashboard</Button>
              </Link>
            </div>
          </header>

          <div ref={planRef}>
            <PlanPreview plan={customGptPlan} />
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render old rule-based plan format
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Your Personalized Health Plan</h1>
          <p className={styles.subtitle}>Plan #{rulePlan!.id.slice(-8)}</p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="ghost"
            onClick={downloadPDF}
            disabled={downloading}
          >
            {downloading ? "Generating PDF..." : "📄 Download PDF"}
          </Button>
          <Link href="/lifeengine/dashboard">
            <Button variant="ghost">← Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <div ref={planRef} className={styles.days}>
        {rulePlan!.days.map((day: any, index: number) => (
          <div key={day.date} className={styles.day}>
            <div className={styles.dayHeader}>
              <h2 className={styles.dayTitle}>Day {index + 1}</h2>
              <span className={styles.date}>
                {new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>

            {day.activities.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Activities</h3>
                <div className={styles.items}>
                  {day.activities.map((activity: any, i: number) => (
                    <div key={i} className={styles.item}>
                      <div className={styles.itemHeader}>
                        <span className={styles.type}>{activity.type}</span>
                        <span className={styles.duration}>{activity.duration} min</span>
                      </div>
                      <h4 className={styles.itemTitle}>{activity.name}</h4>
                      <p className={styles.itemDescription}>{activity.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {day.meals.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Meals</h3>
                <div className={styles.items}>
                  {day.meals.map((meal: any, i: number) => (
                    <div key={i} className={styles.item}>
                      <div className={styles.itemHeader}>
                        <span className={styles.type}>{meal.type}</span>
                        <span className={styles.calories}>{meal.calories} cal</span>
                      </div>
                      <h4 className={styles.itemTitle}>{meal.name}</h4>
                      <p className={styles.itemDescription}>{meal.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
