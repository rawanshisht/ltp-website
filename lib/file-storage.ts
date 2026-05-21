import path from "path";
import fs from "fs/promises";

export async function storeFile(
  file: File,
  folder: string
): Promise<{ url: string; key: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, { access: "public" });
    return { url: blob.url, key: blob.pathname };
  }

  // Local fallback: save to public/uploads/
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filepath = path.join(uploadsDir, safeName);
  await fs.writeFile(filepath, Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${safeName}`, key: `local/uploads/${safeName}` };
}
