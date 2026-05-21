import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SubmissionChecker } from "@/components/teacher/submission-checker";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DeadlineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      subject: true,
      marks: {
        include: { student: true },
        orderBy: { student: { name: "asc" } },
      },
    },
  });

  if (!assignment) notFound();

  // Verify teacher owns this assignment
  const teacher = await prisma.teacher.findUnique({ where: { userId: session!.user.id } });
  if (assignment.teacherId !== teacher?.id) notFound();

  const now = new Date();
  const isPast = new Date(assignment.deadline) < now;

  const handed = assignment.marks.filter((m) => m.handedStatus === "HANDED").length;
  const total = assignment.marks.length;

  return (
    <div>
      <div className="mb-4">
        <Link href="/teacher/deadlines" className="inline-flex items-center gap-1 text-sm text-[--muted-foreground] hover:text-[--foreground]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to deadlines
        </Link>
      </div>

      <Header
        title={assignment.title}
        description={`${assignment.subject.name} · Max ${assignment.maxMarks} marks · Due ${formatDate(assignment.deadline)}`}
      />

      {/* Summary */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="rounded-xl bg-green-50 px-4 py-3">
          <p className="text-xs text-green-600">Handed in</p>
          <p className="text-xl font-bold text-green-700">{handed}/{total}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-600">Pending</p>
          <p className="text-xl font-bold text-slate-700">
            {assignment.marks.filter((m) => m.handedStatus === "PENDING" && !isPast).length}
          </p>
        </div>
        {isPast && (
          <div className="rounded-xl bg-red-50 px-4 py-3">
            <p className="text-xs text-red-600">Overdue</p>
            <p className="text-xl font-bold text-red-700">
              {assignment.marks.filter((m) => m.handedStatus !== "HANDED").length}
            </p>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Submissions</CardTitle>
          <p className="text-sm text-[--muted-foreground]">Check the box when a student hands in their work</p>
        </CardHeader>
        <CardContent>
          {assignment.marks.length === 0 ? (
            <p className="text-sm text-[--muted-foreground]">No students enrolled.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Handed In</TableHead>
                  <TableHead>Marks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignment.marks.map((mark) => {
                  const isHandedIn = mark.handedStatus === "HANDED";
                  const isOverdue = !isHandedIn && isPast;
                  return (
                    <TableRow key={mark.id}>
                      <TableCell className="font-medium">{mark.student.name}</TableCell>
                      <TableCell>
                        <SubmissionChecker
                          markId={mark.id}
                          isHandedIn={isHandedIn}
                          isOverdue={isOverdue}
                        />
                      </TableCell>
                      <TableCell className="text-[--muted-foreground]">
                        {mark.marks !== null ? `${mark.marks}/${assignment.maxMarks}` : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
