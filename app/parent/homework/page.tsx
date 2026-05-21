import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChildSwitcher } from "@/components/parent/child-switcher";
import { HomeworkUploadButton } from "@/components/parent/homework-upload-button";
import { Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ParentHomeworkPage({
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

  const marks = await prisma.studentMark.findMany({
    where: {
      studentId: selected.id,
      assignment: { type: "HOMEWORK" },
    },
    include: {
      assignment: {
        include: {
          subject: true,
          homeworkSubmissions: { where: { studentId: selected.id } },
        },
      },
    },
    orderBy: { assignment: { deadline: "desc" } },
  });

  const isOverdue = (deadline: Date) => new Date(deadline) < new Date();

  return (
    <div>
      <Header
        title="Homework"
        description={`Download handouts and submit completed work for ${selected.name}`}
        actions={<ChildSwitcher children={children} selectedId={selected.id} />}
      />

      <Card>
        <CardHeader><CardTitle>Homework Assignments</CardTitle></CardHeader>
        <CardContent>
          {marks.length === 0 ? (
            <p className="text-sm text-[--muted-foreground]">No homework assignments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Handout</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submit Work</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marks.map((m) => {
                  const a = m.assignment;
                  const submitted = a.homeworkSubmissions.length > 0;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{a.subject.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isOverdue(a.deadline) && m.handedStatus === "PENDING" ? "destructive" : "secondary"}>
                          {formatDate(a.deadline)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {a.fileUrl ? (
                          <a
                            href={a.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-[--primary] hover:underline"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </a>
                        ) : (
                          <span className="text-[--muted-foreground] text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.handedStatus === "HANDED" ? "success" :
                            m.handedStatus === "OVERDUE" ? "destructive" : "secondary"
                          }
                        >
                          {m.handedStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <HomeworkUploadButton
                          studentId={selected.id}
                          assignmentId={a.id}
                          alreadySubmitted={submitted}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
