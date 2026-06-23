import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddClassDialog, EditClassDialog, DeleteClassButton } from "@/components/admin/manage-classes";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminClassesPage() {
  const classes = await prisma.class.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { studentSubjects: true, teacherClasses: true } },
    },
  });

  return (
    <div>
      <Header
        title="Classes"
        description="Manage class groups"
        actions={<AddClassDialog />}
      />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Students Enrolled</TableHead>
                <TableHead>Teachers Assigned</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-(--muted-foreground)">{c._count.studentSubjects}</TableCell>
                  <TableCell className="text-(--muted-foreground)">{c._count.teacherClasses}</TableCell>
                  <TableCell className="text-(--muted-foreground)">{formatDate(c.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <EditClassDialog cls={c} />
                      <DeleteClassButton classId={c.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {classes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-(--muted-foreground) py-8">
                    No classes yet. Add one above.
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
