import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssignClassSelect } from "@/components/teacher/assign-class-select";
import { SearchBar } from "@/components/admin/search-bar";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; classId?: string }>;
}) {
  const session = await auth();
  const { search, classId: selectedClassId } = await searchParams;

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session!.user.id },
    include: {
      teacherSubjects: { include: { subject: true } },
      teacherClasses: { include: { class: true } },
    },
  });

  const subjectIds = teacher!.teacherSubjects.map((ts) => ts.subjectId);
  const teacherClasses = teacher!.teacherClasses.map((tc) => tc.class);
  const allClasses = await prisma.class.findMany({ orderBy: { name: "asc" } });

  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      studentSubjects: {
        some: {
          subjectId: { in: subjectIds },
          droppedAt: null,
          ...(selectedClassId ? { classId: selectedClassId } : {}),
        },
      },
    },
    include: {
      studentSubjects: {
        where: { subjectId: { in: subjectIds }, droppedAt: null },
        include: { subject: true, class: true },
      },
      parentStudents: {
        include: { parent: { include: { user: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  const unassigned = students.filter((s) =>
    s.studentSubjects.some((ss) => ss.classId === null)
  ).length;

  // Build filter URL helper
  function filterHref(cid: string | undefined) {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (cid) params.set("classId", cid);
    const qs = params.toString();
    return `/teacher/students${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <Header
        title="Students"
        description="Assign students to classes per subject"
      />

      {/* Class filter — only show teacher's own classes */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href={filterHref(undefined)}
          className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
            !selectedClassId
              ? "bg-[#00dcde] text-[#0f172a] border-[#00dcde]"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          All Classes
        </Link>
        {teacherClasses.map((c) => (
          <Link
            key={c.id}
            href={filterHref(c.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              selectedClassId === c.id
                ? "bg-[#00dcde] text-[#0f172a] border-[#00dcde]"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {(c.name)}
          </Link>
        ))}
      </div>

      {unassigned > 0 && !selectedClassId && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {unassigned} student{unassigned > 1 ? "s have" : " has"} subjects not yet assigned to a class.
        </div>
      )}

      <SearchBar placeholder="Search students…" />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subject → Class</TableHead>
                <TableHead>Parent / Guardian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium align-top pt-3">{s.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1.5 py-1">
                      {s.studentSubjects.map((ss) => (
                        <div key={ss.id} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {ss.subject.name}
                          </Badge>
                          {ss.class ? (
                            <span className="text-xs text-(--muted-foreground) mr-1">{(ss.class.name)}</span>
                          ) : (
                            <span className="text-xs text-amber-600 mr-1">Unassigned</span>
                          )}
                          <AssignClassSelect
                            studentSubjectId={ss.id}
                            currentClassId={ss.classId ?? null}
                            classes={allClasses}
                          />
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="align-top pt-3">
                    {s.parentStudents.length === 0 ? (
                      <span className="text-(--muted-foreground)">—</span>
                    ) : (
                      <span className="text-sm">
                        {s.parentStudents[0].parent.user.firstName}{" "}
                        {s.parentStudents[0].parent.user.lastName}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-(--muted-foreground) py-8">
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
