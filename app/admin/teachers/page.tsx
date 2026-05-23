import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddTeacherDialog } from "@/components/admin/add-teacher-dialog";

export default async function AdminTeachersPage() {
  const [teachers, subjects, classes] = await Promise.all([
    prisma.teacher.findMany({
      include: {
        user: true,
        teacherSubjects: { include: { subject: true } },
        teacherClasses: { include: { class: true } },
      },
      orderBy: { user: { lastName: "asc" } },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.class.findMany(),
  ]);

  const classLabel = (name: string) =>
    name === "YOUNGER_BOYS" ? "Younger Boys" : name === "OLDER_BOYS" ? "Older Boys" : "Girls";

  return (
    <div>
      <Header
        title="Teachers"
        description="Manage teacher accounts and assignments"
        actions={<AddTeacherDialog subjects={subjects} classes={classes} />}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Classes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.user.firstName} {t.user.lastName}</TableCell>
                  <TableCell className="text-(--muted-foreground)">{t.user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {t.teacherSubjects.map((ts) => (
                        <Badge key={ts.subjectId} variant="secondary">{ts.subject.name}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {t.teacherClasses.map((tc) => (
                        <Badge key={tc.classId} variant="outline">{classLabel(tc.class.name)}</Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {teachers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-(--muted-foreground) py-8">
                    No teachers yet. Add one above.
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
