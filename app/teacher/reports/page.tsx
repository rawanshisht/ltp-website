import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadReportDialog } from "@/components/teacher/upload-report-dialog";
import { FileText, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeacherReportsPage() {
  const session = await auth();

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.user.id },
    include: {
      teacherSubjects: { include: { subject: true } },
      teacherClasses: { include: { class: { include: { students: true } } } },
    },
  });

  // All students in the teacher's classes
  const studentSet = new Map<string, { id: string; name: string }>();
  for (const tc of teacher!.teacherClasses) {
    for (const student of tc.class.students) {
      if (student.isActive) studentSet.set(student.id, { id: student.id, name: student.name });
    }
  }
  const students = Array.from(studentSet.values()).sort((a, b) => a.name.localeCompare(b.name));

  const reports = await prisma.studentReport.findMany({
    where: { teacherId: teacher!.id },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Header
        title="Student Reports"
        description="Upload and manage reports for individual students"
        actions={<UploadReportDialog students={students} teacherId={teacher!.id} />}
      />

      <Card>
        <CardHeader><CardTitle>Uploaded Reports</CardTitle></CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-(--muted-foreground)">No reports uploaded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-(--muted-foreground)" />
                        <span className="font-medium">{r.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{r.student.name}</Badge>
                    </TableCell>
                    <TableCell className="text-(--muted-foreground) max-w-xs truncate">
                      {r.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-(--muted-foreground) whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      {r.fileUrl ? (
                        <a
                          href={r.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-cyan-700 hover:underline"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">No file</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
