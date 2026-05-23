import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChildSwitcher } from "@/components/parent/child-switcher";
import { ContactTeacherCard } from "@/components/parent/contact-teacher-card";
import { formatDate } from "@/lib/utils";
import { Bell } from "lucide-react";

export default async function ParentNoticesPage({
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

  const enrolledSubjectIds = (
    await prisma.studentSubject.findMany({
      where: { studentId: selected.id, droppedAt: null },
      select: { subjectId: true },
    })
  ).map((s) => s.subjectId);

  const notices = await prisma.notice.findMany({
    where: { subjectId: { in: enrolledSubjectIds } },
    include: { subject: true, teacher: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  const teachers = await prisma.teacher.findMany({
    where: {
      teacherSubjects: { some: { subjectId: { in: enrolledSubjectIds } } },
      teacherClasses: { some: { classId: selected.classId } },
    },
    include: { user: true, teacherSubjects: { include: { subject: true } } },
  });

  const teacherContacts = teachers.map((t) => ({
    id: t.id,
    name: `${t.user.firstName} ${t.user.lastName}`,
    email: t.user.email,
    subjects: t.teacherSubjects.map((ts) => ts.subject.name),
  }));

  return (
    <div>
      <Header
        title="Notices"
        description={`Notices for ${selected.name}'s subjects`}
        actions={<ChildSwitcher children={children} selectedId={selected.id} />}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          {notices.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-8 w-8 mx-auto text-(--muted-foreground) mb-3" />
                <p className="text-(--muted-foreground)">No notices yet.</p>
              </CardContent>
            </Card>
          ) : (
            notices.map((notice) => (
              <Card key={notice.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{notice.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {notice.teacher.user.firstName} {notice.teacher.user.lastName} · {notice.subject.name} · {formatDate(notice.createdAt)}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{notice.subject.name}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-(--foreground) whitespace-pre-line">{notice.body}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Contact teachers */}
        <div>
          <ContactTeacherCard teachers={teacherContacts} childName={selected.name} />
        </div>
      </div>
    </div>
  );
}
