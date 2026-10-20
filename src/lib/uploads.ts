import path from "path";

// Local photo storage. Move to Supabase Storage or Cloudinary before deploying.
export const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

export function uploadPath(name: string): string {
  return path.join(process.cwd(), "data", "uploads", name);
}
