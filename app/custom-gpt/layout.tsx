import AppShell from "@/components/layout/AppShell";

export default function CustomGPTLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
