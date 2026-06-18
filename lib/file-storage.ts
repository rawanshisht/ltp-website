import path from "path";
import fs from "fs/promises";

export async function storeFile(
  file: File,
  folder: string
): Promise<{ url: string; key: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, { access: "private" });
    return { url: blob.url, key: blob.pathname };
  }

  // Production requires BLOB_READ_WRITE_TOKEN — no writable filesystem on Vercel
  if (process.env.VERCEL) {
    throw new Error("BLOB_READ_WRITE_TOKEN must be set for file uploads in production");
  }

  // Local dev fallback: save to public/uploads/
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filepath = path.join(uploadsDir, safeName);
  await fs.writeFile(filepath, Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${safeName}`, key: `local/uploads/${safeName}` };
}

export function fileDownloadUrl(fileUrl: string): string {
  return `/api/files/download?url=${encodeURIComponent(fileUrl)}`;
}
