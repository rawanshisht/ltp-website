import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function PATCH(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, action } = await req.json();
  await prisma.incidentLog.update({ where: { id }, data: { action: action ?? null } });

  revalidatePath("/admin/incidents");
  return NextResponse.json({ ok: true });
}
