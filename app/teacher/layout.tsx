import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/shell";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") redirect("/login");

  return (
    <Shell role="TEACHER" userName={session.user.name ?? "Teacher"}>
      {children}
    </Shell>
  );
}
