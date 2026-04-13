import { asc, eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { gradImages } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-guard";
import { GRAD_SLUGS } from "@/lib/constants";
import { processAndSaveImage } from "@/lib/image-process";
import { gradUploadDir } from "@/lib/paths";

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const grad = searchParams.get("grad");
  if (!grad || !GRAD_SLUGS.includes(grad as (typeof GRAD_SLUGS)[number])) {
    return NextResponse.json({ error: "Invalid grad" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(gradImages)
    .where(eq(gradImages.gradSlug, grad))
    .orderBy(asc(gradImages.id));

  return NextResponse.json({ images: rows });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const form = await request.formData();
  const grad = form.get("grad");
  const file = form.get("file");
  if (typeof grad !== "string" || !GRAD_SLUGS.includes(grad as (typeof GRAD_SLUGS)[number])) {
    return NextResponse.json({ error: "Invalid grad" }, { status: 400 });
  }
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = "jpg";
  const base = `upload-${Date.now()}`;
  const filename = `${base}.${ext}`;

  await processAndSaveImage(buf, grad, filename);

  const [row] = await db
    .insert(gradImages)
    .values({ gradSlug: grad, filename })
    .returning();

  return NextResponse.json({ image: row });
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { id?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = body.id;
  if (typeof id !== "number" || !Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [row] = await db
    .select()
    .from(gradImages)
    .where(eq(gradImages.id, id))
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const full = path.join(gradUploadDir(row.gradSlug), row.filename);
  try {
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch {
    /* ignore */
  }

  await db.delete(gradImages).where(eq(gradImages.id, id));
  return NextResponse.json({ ok: true });
}
