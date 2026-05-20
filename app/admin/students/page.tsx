import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddStudentDialog } from "@/components/admin/add-student-dialog";

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ inactive?: string }>;
}) {
  const { inactive } = await searchParams;
  const showInactive = inactive === "true";

  const [students, subjects, classes, parents] = await Promise.all([
    prisma.student.findMany({
      where: showInactive ? {} : { isActive: true },
      include: {
        class: true,
        studentSubjects: {
          where: { droppedAt: null },
          include: { subject: true },
        },
        parentStudents: { include: { parent: { include: { user: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.class.findMany(),
    prisma.parent.findMany({ include: { user: true } }),
  ]);

  const classLabel = (name: string) =>
    name === "YOUNGER_BOYS" ? "Younger Boys" : name === "OLDER_BOYS" ? "Older Boys" : "Girls";

  return (
    <div>
      <Header
        title="Students"
        description="Manage student enrollment and subjects"
        actions={
          <div className="flex items-center gap-2">
            <a
              href={showInactive ? "/admin/students" : "/admin/students?inactive=true"}
              className="text-sm text-[--primary] hover:underline"
            >
              {showInactive ? "Show active only" : "Show inactive"}
            </a>
            <AddStudentDialog subjects={subjects} classes={classes} parents={parents} />
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{classLabel(s.class.name)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.studentSubjects.map((ss) => (
                        <Badge key={ss.subjectId} variant="secondary" className="text-xs">
                          {ss.subject.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-[--muted-foreground]">
                    {s.parentStudents.map((ps) => `${ps.parent.user.firstName} ${ps.parent.user.lastName}`).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.isActive ? "success" : "secondary"}>
                      {s.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[--muted-foreground] py-8">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
