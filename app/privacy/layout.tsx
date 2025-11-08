import AppShell from "@/components/layout/AppShell";

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
