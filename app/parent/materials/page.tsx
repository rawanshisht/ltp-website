import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChildSwitcher } from "@/components/parent/child-switcher";
import { FileText, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ParentMaterialsPage({
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

  // Get subjects the child is enrolled in
  const enrollments = await prisma.studentSubject.findMany({
    where: { studentId: selected.id, droppedAt: null },
    select: { subjectId: true },
  });
  const subjectIds = enrollments.map((e) => e.subjectId);

  const materials = await prisma.classMaterial.findMany({
    where: { subjectId: { in: subjectIds } },
    include: { subject: true, teacher: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  const bySubject = materials.reduce<Record<string, typeof materials>>((acc, m) => {
    const key = m.subject.name;
    acc[key] = acc[key] ?? [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div>
      <Header
        title="Class Materials"
        description={`Resources and handouts for ${selected.name}`}
        actions={<ChildSwitcher children={children} selectedId={selected.id} />}
      />

      {Object.keys(bySubject).length === 0 ? (
        <Card><CardContent className="p-8 text-center text-(--muted-foreground)">No materials uploaded yet.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(bySubject).map(([subject, items]) => (
            <Card key={subject}>
              <CardHeader>
                <CardTitle>{subject}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Download</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-(--muted-foreground)" />
                            <span className="font-medium">{m.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-(--muted-foreground)">
                          {m.teacher.user.firstName} {m.teacher.user.lastName}
                        </TableCell>
                        <TableCell className="text-(--muted-foreground)">{formatDate(m.createdAt)}</TableCell>
                        <TableCell>
                          {m.fileUrl ? (
                            <a
                              href={m.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-(--primary) hover:underline"
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
