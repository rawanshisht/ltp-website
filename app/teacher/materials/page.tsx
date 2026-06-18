import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadMaterialDialog } from "@/components/teacher/upload-material-dialog";
import { MaterialFilters } from "@/components/teacher/material-filters";
import { MaterialsTable } from "@/components/teacher/materials-table";

export const dynamic = "force-dynamic";

export default async function TeacherMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; class?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const subjectId = params.subject;
  const classId = params["class"];

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.user.id },
    include: { teacherSubjects: { include: { subject: true } } },
  });

  const subjects = teacher!.teacherSubjects.map((ts) => ts.subject);
  const classes = await prisma.class.findMany({ orderBy: { name: "asc" } });

  const materials = await prisma.classMaterial.findMany({
    where: {
      teacherId: teacher!.id,
      ...(subjectId && { subjectId }),
      ...(classId && { classes: { some: { classId } } }),
    },
    include: { subject: true, classes: { include: { class: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Header
        title="Class Materials"
        description="Upload handouts and resources for your classes"
        actions={<UploadMaterialDialog subjects={subjects} classes={classes} teacherId={teacher!.id} />}
      />

      <MaterialFilters
        subjects={subjects}
        classes={classes}
        currentSubjectId={subjectId ?? ""}
        currentClassId={classId ?? ""}
      />

      <Card>
        <CardHeader><CardTitle>Uploaded Materials</CardTitle></CardHeader>
        <CardContent>
          <MaterialsTable materials={materials} subjects={subjects} classes={classes} />
        </CardContent>
      </Card>
    </div>
  );
}
