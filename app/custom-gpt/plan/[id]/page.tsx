"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface DayPage {
  dayNumber: number;
  title: string;
  content: string;
}

interface PlanData {
  id: string;
  plan: {
    raw: string;
    pages: DayPage[];
    metadata: {
      generatedAt: string;
      model: string;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      estimatedCost: number;
      duration: number;
    };
  };
  formData: any;
  createdAt: string;
}

export default function CustomGPTPlanPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load plan from localStorage
    const storedPlans = JSON.parse(localStorage.getItem("custom_gpt_plans") || "[]");
    const plan = storedPlans.find((p: PlanData) => p.id === params.id);

    if (plan) {
      setPlanData(plan);
      // Select all days by default
      setSelectedDays(new Set(plan.plan.pages.map((_page: DayPage, idx: number) => idx)));
    }
    setLoading(false);
  }, [params.id]);

  const handleDownloadPDF = async (dayIndices?: number[]) => {
    if (!planData || !printRef.current) return;

    setDownloading(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pagesToExport = dayIndices || Array.from(selectedDays);

      for (let i = 0; i < pagesToExport.length; i++) {
        const dayIndex = pagesToExport[i];
        const pageEl = printRef.current.querySelector<HTMLDivElement>(
          `[data-day-index="${dayIndex}"]`
        );

        if (!pageEl) continue;

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      }

      const fileName = `CustomGPT_Plan_${planData.formData.fullName}_${new Date().toLocaleDateString()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const toggleDaySelection = (index: number) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <span className="text-6xl mb-4 block">😕</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan Not Found</h2>
          <p className="text-gray-600 mb-6">
            The plan you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/custom-gpt/create">
            <Button>Create New Plan</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentPage = planData.plan.pages[currentPageIndex];
  const totalPages = planData.plan.pages.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/custom-gpt/create">
                <Button variant="ghost" className="text-gray-600">
                  ← Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  Custom GPT Plan: {planData.formData.fullName}
                </h1>
                <p className="text-sm text-gray-500">
                  {totalPages} days · Generated with {planData.plan.metadata.model} ·{" "}
                  {new Date(planData.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleDownloadPDF(Array.from(selectedDays).sort((a, b) => a - b))}
                disabled={downloading || selectedDays.size === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {downloading ? "Exporting..." : `📥 Download Selected (${selectedDays.size})`}
              </Button>
              <Button
                onClick={() =>
                  handleDownloadPDF(planData.plan.pages.map((_, idx) => idx))
                }
                disabled={downloading}
                variant="ghost"
              >
                Download All
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Day Index Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>📋</span>
                Day Index
              </h3>
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {planData.plan.pages.map((page, idx) => (
                  <div
                    key={idx}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                      idx === currentPageIndex
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCurrentPageIndex(idx)}
                        className="flex-1 text-left font-medium"
                      >
                        {page.title}
                      </button>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedDays.has(idx)}
                          onChange={() => toggleDaySelection(idx)}
                          className="w-4 h-4"
                          title={`Select ${page.title} for download`}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <Button
                onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                disabled={currentPageIndex === 0}
                variant="ghost"
              >
                ← Previous Day
              </Button>
              <span className="font-medium text-gray-700">
                Day {currentPageIndex + 1} of {totalPages}
              </span>
              <Button
                onClick={() =>
                  setCurrentPageIndex(Math.min(totalPages - 1, currentPageIndex + 1))
                }
                disabled={currentPageIndex === totalPages - 1}
                variant="ghost"
              >
                Next Day →
              </Button>
            </div>

            {/* Page Content */}
            <div
              ref={contentRef}
              className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 min-h-[600px]"
            >
              <div className="prose prose-lg max-w-none">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <span className="text-4xl">📘</span>
                  {currentPage.title}
                </h2>
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {currentPage.content}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-6 bg-blue-50 rounded-xl border border-blue-200 p-4">
              <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <span>ℹ️</span>
                Generation Details
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-blue-600 font-medium">Model</p>
                  <p className="text-blue-900">{planData.plan.metadata.model}</p>
                </div>
                <div>
                  <p className="text-blue-600 font-medium">Tokens Used</p>
                  <p className="text-blue-900">
                    {planData.plan.metadata.totalTokens.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600 font-medium">Est. Cost</p>
                  <p className="text-blue-900">
                    ${planData.plan.metadata.estimatedCost.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-600 font-medium">Generation Time</p>
                  <p className="text-blue-900">
                    {(planData.plan.metadata.duration / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden print container */}
      <div className="hidden">
        <div ref={printRef}>
          {planData.plan.pages.map((page, idx) => (
            <div
              key={idx}
              data-day-index={idx}
              className="bg-white p-8 min-h-screen page-break-after"
            >
              <h2 className="text-3xl font-bold mb-6">{page.title}</h2>
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {page.content}
              </div>
              <div className="mt-8 pt-4 border-t border-gray-200 text-sm text-gray-500">
                <p>Generated by TH-LifeEngine Custom GPT</p>
                <p>
                  {planData.formData.fullName} ·{" "}
                  {new Date(planData.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
