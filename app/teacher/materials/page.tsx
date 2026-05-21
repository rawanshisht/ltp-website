import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadMaterialDialog } from "@/components/teacher/upload-material-dialog";
import { FileText, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function TeacherMaterialsPage() {
  const session = await auth();

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.user.id },
    include: { teacherSubjects: { include: { subject: true } } },
  });

  const subjects = teacher!.teacherSubjects.map((ts) => ts.subject);

  const materials = await prisma.classMaterial.findMany({
    where: { teacherId: teacher!.id },
    include: { subject: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Header
        title="Class Materials"
        description="Upload handouts and resources for your classes"
        actions={<UploadMaterialDialog subjects={subjects} teacherId={teacher!.id} />}
      />

      <Card>
        <CardHeader><CardTitle>Uploaded Materials</CardTitle></CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-sm text-[--muted-foreground]">No materials uploaded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[--muted-foreground]" />
                        <span className="font-medium">{m.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{m.subject.name}</Badge>
                    </TableCell>
                    <TableCell className="text-[--muted-foreground]">{formatDate(m.createdAt)}</TableCell>
                    <TableCell>
                      <a
                        href={m.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-[--primary] hover:underline"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </a>
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
