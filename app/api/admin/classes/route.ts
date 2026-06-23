import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });

  try {
    const cls = await prisma.class.create({ data: { name: name.trim() } });
    return NextResponse.json(cls);
  } catch {
    return NextResponse.json({ error: "A class with that name already exists." }, { status: 400 });
  }
}
