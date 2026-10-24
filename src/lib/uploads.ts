import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Listing photos. With SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set they go to a public Supabase Storage bucket;
// without them, to data/uploads/ (served by src/app/uploads/[name]/route.ts) for local use.

const BUCKET = "product-photos";
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

export function uploadPath(name: string): string {
  return path.join(UPLOADS_DIR, name);
}

function supabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : undefined;
}

export function photoStorageConnected(): boolean {
  return Boolean(supabase());
}

async function storage(path: string, init: RequestInit): Promise<Response> {
  const { url, key } = supabase()!;
  return fetch(`${url}/storage/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...init.headers },
    cache: "no-store",
  });
}

let bucketReady: Promise<void> | undefined;

// Creates the public photo bucket the first time it's needed.
function ensureBucket(): Promise<void> {
  bucketReady ??= (async () => {
    const existing = await storage(`bucket/${BUCKET}`, { method: "GET" });
    if (existing.ok) return;
    const created = await storage("bucket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true, file_size_limit: MAX_IMAGE_BYTES, allowed_mime_types: Object.keys(IMAGE_TYPES) }),
    });
    if (!created.ok && created.status !== 409) throw new Error(`Couldn't create photo bucket: ${await created.text()}`);
  })().catch((err) => {
    bucketReady = undefined;
    throw err;
  });
  return bucketReady;
}

async function saveImage(file: File, name: string): Promise<string> {
  if (!supabase()) {
    if (process.env.VERCEL) throw new Error("Photo storage isn't connected: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.writeFile(uploadPath(name), Buffer.from(await file.arrayBuffer()));
    return `/uploads/${name}`;
  }
  await ensureBucket();
  const res = await storage(`object/${BUCKET}/${name}`, {
    method: "POST",
    headers: { "Content-Type": file.type, "Cache-Control": "max-age=31536000" },
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!res.ok) throw new Error(`Photo upload failed: ${await res.text()}`);
  return `${supabase()!.url}/storage/v1/object/public/${BUCKET}/${name}`;
}

// Saves the JPG, PNG and WebP photos under 5 MB and returns their URLs; others are skipped.
export async function saveImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const ext = IMAGE_TYPES[file.type];
    if (!ext || file.size > MAX_IMAGE_BYTES) continue;
    urls.push(await saveImage(file, `${randomUUID()}${ext}`));
  }
  return urls;
}
