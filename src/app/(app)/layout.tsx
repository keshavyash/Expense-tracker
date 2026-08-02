import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import { Nav } from "@/components/Nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Nav displayName={profile.display_name} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
