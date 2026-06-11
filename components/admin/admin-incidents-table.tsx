"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Incident = {
  id: string;
  date: Date;
  title: string;
  description: string;
  severity: "MINOR" | "MODERATE" | "MAJOR";
  action: string | null;
  student: { name: string };
  subject: { name: string } | null;
  teacher: { user: { firstName: string; lastName: string } };
};

function severityVariant(s: string) {
  if (s === "MAJOR") return "destructive";
  if (s === "MODERATE") return "warning";
  return "success";
}

export function AdminIncidentsTable({ incidents }: { incidents: Incident[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionText, setActionText] = useState("");
  const [saving, setSaving] = useState(false);
  const [localActions, setLocalActions] = useState<Record<string, string | null>>({});

  function openActionDialog(inc: Incident) {
    setEditingId(inc.id);
    setActionText(localActions[inc.id] !== undefined ? (localActions[inc.id] ?? "") : (inc.action ?? ""));
  }

  async function handleSave() {
    if (!editingId) return;
    setSaving(true);
    const saved = actionText.trim() || null;
    await fetch("/api/admin/incidents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, action: saved }),
    });
    setLocalActions((prev) => ({ ...prev, [editingId]: saved }));
    setSaving(false);
    setEditingId(null);
    router.refresh();
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Logged by</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Action Taken</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((inc) => (
            <TableRow key={inc.id}>
              <TableCell className="text-(--muted-foreground) whitespace-nowrap">{formatDate(inc.date)}</TableCell>
              <TableCell className="font-medium">{inc.student.name}</TableCell>
              <TableCell>{inc.title}</TableCell>
              <TableCell>{inc.subject?.name ?? "—"}</TableCell>
              <TableCell>
                <Badge variant={severityVariant(inc.severity)}>
                  {inc.severity.charAt(0) + inc.severity.slice(1).toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-(--muted-foreground)">
                {inc.teacher.user.firstName} {inc.teacher.user.lastName}
              </TableCell>
              <TableCell className="text-(--muted-foreground) text-sm max-w-xs">{inc.description}</TableCell>
              <TableCell className="min-w-48">
                <div className="flex items-start gap-2">
                  <span className="text-sm text-(--muted-foreground) flex-1">
                    {(localActions[inc.id] !== undefined ? localActions[inc.id] : inc.action)
                      ?? <span className="italic text-xs">No action recorded</span>}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0"
                    onClick={() => openActionDialog(inc)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editingId} onOpenChange={(o) => !o && setEditingId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Action Taken</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2 mb-4">
            <Textarea
              rows={4}
              placeholder="Describe the action taken (e.g. parent contacted, detention issued)…"
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
