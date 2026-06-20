// This route is superseded by /api/teacher/student-subjects/[id]
// Kept as a no-op to avoid 404s from any stale client calls
import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json({ error: "Use /api/teacher/student-subjects/:id instead" }, { status: 410 });
}
