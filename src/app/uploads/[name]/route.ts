import { promises as fs } from "fs";
import path from "path";
import { uploadPath } from "@/lib/uploads";

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

// Serves listing photos saved by the admin form. Files added to public/ after a build aren't served, hence this route.
export async function GET(_request: Request, { params }: RouteContext<"/uploads/[name]">) {
  const { name } = await params;
  const type = TYPES[path.extname(name)];
  if (!type || name !== path.basename(name)) return new Response("Not found", { status: 404 });
  try {
    const file = await fs.readFile(uploadPath(name));
    return new Response(file, { headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
