import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  return (
    <Shell role="ADMIN" userName={session.user.name ?? "Admin"}>
      {children}
    </Shell>
  );
}
