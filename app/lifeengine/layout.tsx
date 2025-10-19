import LifeEngineNav from "@/components/lifeengine/LifeEngineNav";

export default function LifeEngineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <LifeEngineNav />
      <div className="flex-1 px-6 py-10 lg:px-12">{children}</div>
    </div>
  );
}
