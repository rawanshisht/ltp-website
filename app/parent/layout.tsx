import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/shell";

export const dynamic = "force-dynamic";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "PARENT") redirect("/login");

  return (
    <Shell role="PARENT" userName={session.user.name ?? "Parent"}>
      {children}
    </Shell>
  );
}
