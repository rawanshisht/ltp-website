import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateNoticeDialog } from "@/components/teacher/create-notice-dialog";
import { formatDate } from "@/lib/utils";

export default async function TeacherNoticesPage() {
  const session = await auth();

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.user.id },
    include: {
      teacherSubjects: { include: { subject: true } },
      notices: {
        include: { subject: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const subjects = teacher!.teacherSubjects.map((ts) => ts.subject);

  return (
    <div>
      <Header
        title="Notices"
        description="Post announcements to parents"
        actions={<CreateNoticeDialog subjects={subjects} teacherId={teacher!.id} />}
      />

      <div className="space-y-4">
        {teacher!.notices.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-(--muted-foreground) text-sm">
              No notices posted yet.
            </CardContent>
          </Card>
        ) : (
          teacher!.notices.map((notice) => (
            <Card key={notice.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{notice.title}</CardTitle>
                    <CardDescription>{formatDate(notice.createdAt)}</CardDescription>
                  </div>
                  <Badge variant="secondary">{notice.subject.name}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">{notice.body}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
