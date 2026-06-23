import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, type } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!["CORE", "OPTIONAL"].includes(type)) return NextResponse.json({ error: "Invalid type." }, { status: 400 });

  try {
    const subject = await prisma.subject.create({ data: { name: name.trim(), type } });
    return NextResponse.json(subject);
  } catch {
    return NextResponse.json({ error: "A subject with that name already exists." }, { status: 400 });
  }
}
