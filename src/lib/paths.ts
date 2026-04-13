import path from "path";

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOADS_ROOT = path.join(DATA_DIR, "uploads");

export function gradUploadDir(gradSlug: string): string {
  return path.join(UPLOADS_ROOT, gradSlug);
}
