import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChildSwitcher } from "@/components/parent/child-switcher";
import { formatDate } from "@/lib/utils";

function starDisplay(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function avgStars(records: { behaviourStars: number; attentiveStars: number; engagementStars: number }[], field: "behaviourStars" | "attentiveStars" | "engagementStars") {
  if (!records.length) return 0;
  return records.reduce((s, r) => s + r[field], 0) / records.length;
}

function MiniBarChart({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium w-8 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

export default async function ParentBehaviourPage({
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

  const behaviours = await prisma.behaviour.findMany({
    where: { studentId: selected.id },
    include: { subject: true },
    orderBy: { lessonDate: "desc" },
  });

  const bySubject = behaviours.reduce<Record<string, typeof behaviours>>((acc, b) => {
    const key = b.subject.name;
    acc[key] = acc[key] ?? [];
    acc[key].push(b);
    return acc;
  }, {});

  return (
    <div>
      <Header
        title="Behaviour"
        description={`Behaviour records for ${selected.name}`}
        actions={<ChildSwitcher children={children} selectedId={selected.id} />}
      />

      {/* Per-subject summary cards with bar charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {Object.entries(bySubject).map(([subject, records]) => {
          const avgB = avgStars(records, "behaviourStars");
          const avgA = avgStars(records, "attentiveStars");
          const avgE = avgStars(records, "engagementStars");
          return (
            <Card key={subject}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{subject}</CardTitle>
                <p className="text-xs text-[--muted-foreground]">{records.length} sessions</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-[--muted-foreground] mb-1">Behaviour</p>
                  <MiniBarChart value={avgB} color="bg-[#00dcde]" />
                </div>
                <div>
                  <p className="text-xs text-[--muted-foreground] mb-1">Attentive</p>
                  <MiniBarChart value={avgA} color="bg-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-[--muted-foreground] mb-1">Engagement</p>
                  <MiniBarChart value={avgE} color="bg-amber-500" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full log */}
      <Card>
        <CardHeader><CardTitle>Detailed Behaviour Log</CardTitle></CardHeader>
        <CardContent>
          {behaviours.length === 0 ? (
            <p className="text-sm text-[--muted-foreground]">No behaviour records yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Behaviour</TableHead>
                  <TableHead>Attentive</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Teacher Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {behaviours.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-[--muted-foreground] whitespace-nowrap">{formatDate(b.lessonDate)}</TableCell>
                    <TableCell className="font-medium">{b.subject.name}</TableCell>
                    <TableCell>
                      <span className="text-amber-400 tracking-tight">{starDisplay(b.behaviourStars)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-amber-400 tracking-tight">{starDisplay(b.attentiveStars)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-amber-400 tracking-tight">{starDisplay(b.engagementStars)}</span>
                    </TableCell>
                    <TableCell className="text-[--muted-foreground] italic">{b.note ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
