import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChildSwitcher } from "@/components/parent/child-switcher";
import { FileText, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ParentReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const session = await auth();
  const { child: childId } = await searchParams;

  const parent = await prisma.parent.findUnique({
    where: { userId: session!.user.id },
    include: { parentStudents: { include: { student: true } } },
  });

  const children = parent!.parentStudents.map((ps) => ps.student);
  const selected = children.find((c) => c.id === childId) ?? children[0];

  const reports = await prisma.studentReport.findMany({
    where: { studentId: selected.id },
    include: { teacher: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Header
        title="Reports"
        description={`Reports uploaded by teachers for ${selected.name}`}
        actions={<ChildSwitcher children={children} selectedId={selected.id} />}
      />

      <Card>
        <CardHeader><CardTitle>Reports</CardTitle></CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-(--muted-foreground)">No reports have been uploaded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Download</TableHead>
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
                      <Badge variant="secondary">
                        {r.teacher.user.firstName} {r.teacher.user.lastName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-(--muted-foreground) max-w-xs">
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
                          className="inline-flex items-center gap-1 text-sm text-cyan-700 hover:underline font-medium"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">No file attached</span>
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
