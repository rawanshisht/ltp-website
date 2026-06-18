import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Local dev: files are served as static assets
  if (url.startsWith("/uploads/")) {
    return NextResponse.redirect(new URL(url, req.url));
  }

  // Production: generate a signed download URL from Vercel Blob
  if (!url.includes("blob.vercel-storage.com")) {
    return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
  }

  try {
    const { head } = await import("@vercel/blob");
    const blob = await head(url);
    return NextResponse.redirect(blob.downloadUrl);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
