import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { DeadlineFilters } from "@/components/teacher/deadline-filters";

export const dynamic = "force-dynamic";

export default async function TeacherDeadlinesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; status?: string }>;
}) {
  const session = await auth();
  const { subject: subjectId, status } = await searchParams;

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.user.id },
    include: {
      teacherSubjects: { include: { subject: true } },
      teacherClasses: { include: { class: { include: { students: true } } } },
    },
  });

  const studentIds = teacher!.teacherClasses.flatMap((tc) => tc.class.students.map((s) => s.id));
  const subjects = teacher!.teacherSubjects.map((ts) => ts.subject);

  // Only homework assignments (assessments don't have handed/overdue)
  const assignments = await prisma.assignment.findMany({
    where: {
      teacherId: teacher!.id,
      type: "HOMEWORK",
      ...(subjectId && { subjectId }),
    },
    include: {
      subject: true,
      marks: { where: { studentId: { in: studentIds } } },
    },
    orderBy: { deadline: "asc" },
  });

  const now = new Date();

  // Compute effective status counts per assignment
  const enriched = assignments.map((a) => {
    const isPast = new Date(a.deadline) < now;
    const handed = a.marks.filter((m) => m.handedStatus === "HANDED").length;
    // Overdue = pending marks where deadline has passed
    const overdue = a.marks.filter(
      (m) => m.handedStatus === "PENDING" && isPast
    ).length;
    const pending = a.marks.filter(
      (m) => m.handedStatus === "PENDING" && !isPast
    ).length;
    const total = a.marks.length;
    return { ...a, handed, overdue, pending, total, isPast };
  });

  // Status filter: "pending" (default) = has any pending or overdue, "handed" = all handed, "all"
  const filtered =
    status === "all"
      ? enriched
      : status === "handed"
      ? enriched.filter((a) => a.handed === a.total && a.total > 0)
      : enriched.filter((a) => a.pending > 0 || a.overdue > 0); // default: pending/overdue

  return (
    <div>
      <Header title="Deadlines" description="Homework submission tracking — click a title to mark students" />

      <DeadlineFilters
        subjects={subjects}
        currentSubjectId={subjectId ?? ""}
        currentStatus={status ?? ""}
      />

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-sm text-[--muted-foreground] p-6">No assignments found.</p>
          ) : (
            <ul className="divide-y divide-[--border]">
              {filtered.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/teacher/deadlines/${a.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div>
                      <p className="font-medium text-[--foreground] group-hover:text-[--primary] transition-colors">
                        {a.title}
                      </p>
                      <p className="text-xs text-[--muted-foreground] mt-0.5">
                        {a.subject.name} · Due {formatDate(a.deadline)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {a.handed > 0 && (
                        <Badge variant="success">{a.handed} handed</Badge>
                      )}
                      {a.overdue > 0 && (
                        <Badge variant="destructive">{a.overdue} overdue</Badge>
                      )}
                      {a.pending > 0 && (
                        <Badge variant="secondary">{a.pending} pending</Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-[--muted-foreground]" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
