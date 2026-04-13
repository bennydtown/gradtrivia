import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { gradUploadDir } from "@/lib/paths";
import { GRAD_SLUGS } from "@/lib/constants";

export async function GET(
  _req: Request,
  context: { params: Promise<{ grad: string; file: string }> },
) {
  const { grad, file } = await context.params;
  const base = file.split("/").pop() ?? file;
  const safe = path.basename(base);
  if (!GRAD_SLUGS.includes(grad as (typeof GRAD_SLUGS)[number])) {
    return new NextResponse("Not found", { status: 404 });
  }
  const dir = gradUploadDir(grad);
  const full = path.join(dir, safe);
  if (!full.startsWith(dir)) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!fs.existsSync(full)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const buf = await fs.promises.readFile(full);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
