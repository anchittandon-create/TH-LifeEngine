import { Suspense } from "react";
import AppHeader from "@/components/lifeengine/AppHeader";
import { PageSkeleton } from "@/components/lifeengine/PageSkeleton";

function PageContainer({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-6 md:py-8">{children}</main>;
}

export default function LifeEngineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader />
      <Suspense fallback={<PageContainer><PageSkeleton /></PageContainer>}>
        <PageContainer>{children}</PageContainer>
      </Suspense>
    </div>
  );
}
