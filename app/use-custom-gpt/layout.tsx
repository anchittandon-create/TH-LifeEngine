import AppShell from "@/components/layout/AppShell";

export default function UseCustomGPTLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
