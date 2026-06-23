import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddTeacherDialog } from "@/components/admin/add-teacher-dialog";
import { EditTeacherDialog, DeleteTeacherButton } from "@/components/admin/edit-teacher-dialog";
import { SearchBar } from "@/components/admin/search-bar";

export const dynamic = "force-dynamic";

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;

  const [teachers, subjects, classes] = await Promise.all([
    prisma.teacher.findMany({
      where: search
        ? {
            OR: [
              { user: { firstName: { contains: search, mode: "insensitive" } } },
              { user: { lastName: { contains: search, mode: "insensitive" } } },
            ],
          }
        : undefined,
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

  return (
    <div>
      <Header
        title="Teachers"
        description="Manage teacher accounts and assignments"
        actions={<AddTeacherDialog subjects={subjects} classes={classes} />}
      />

      <SearchBar placeholder="Search teachers…" />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead className="w-24">Actions</TableHead>
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
                        <Badge key={tc.classId} variant="outline">{tc.class.name}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <EditTeacherDialog
                        teacher={{
                          id: t.id,
                          user: { firstName: t.user.firstName, lastName: t.user.lastName, email: t.user.email },
                          teacherSubjects: t.teacherSubjects.map((ts) => ({ subjectId: ts.subjectId })),
                          teacherClasses: t.teacherClasses.map((tc) => ({ classId: tc.classId })),
                        }}
                        subjects={subjects}
                        classes={classes}
                      />
                      <DeleteTeacherButton teacherId={t.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {teachers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-(--muted-foreground) py-8">
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
