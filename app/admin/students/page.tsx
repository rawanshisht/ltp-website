import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddStudentDialog } from "@/components/admin/add-student-dialog";
import { Phone, Mail } from "lucide-react";

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
        parentStudents: {
          include: { parent: { include: { user: true } } },
        },
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
              className="text-sm text-(--primary) hover:underline"
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
                <TableHead>Parent / Guardian</TableHead>
                <TableHead>Contact</TableHead>
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
                  <TableCell>
                    {s.parentStudents.length === 0 ? (
                      <span className="text-(--muted-foreground)">—</span>
                    ) : (
                      <div className="space-y-1">
                        {s.parentStudents.map((ps) => (
                          <p key={ps.parent.id} className="font-medium text-sm">
                            {ps.parent.user.firstName} {ps.parent.user.lastName}
                          </p>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.parentStudents.length === 0 ? (
                      <span className="text-(--muted-foreground)">—</span>
                    ) : (
                      <div className="space-y-1">
                        {s.parentStudents.map((ps) => (
                          <div key={ps.parent.id} className="space-y-0.5">
                            <a
                              href={`mailto:${ps.parent.user.email}`}
                              className="flex items-center gap-1 text-xs text-(--primary) hover:underline"
                            >
                              <Mail className="h-3 w-3" />
                              {ps.parent.user.email}
                            </a>
                            {ps.parent.user.phone && (
                              <a
                                href={`tel:${ps.parent.user.phone}`}
                                className="flex items-center gap-1 text-xs text-(--muted-foreground) hover:text-(--foreground)"
                              >
                                <Phone className="h-3 w-3" />
                                {ps.parent.user.phone}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
                  <TableCell colSpan={6} className="text-center text-(--muted-foreground) py-8">
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
