import fs from "fs";
import path from "path";
import sharp from "sharp";
import { gradUploadDir } from "./paths";

const MAX_WIDTH = 1200;
const JPEG_QUALITY = 80;

export async function processAndSaveImage(
  inputBuffer: Buffer,
  gradSlug: string,
  destFilename: string,
): Promise<void> {
  const dir = gradUploadDir(gradSlug);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const outPath = path.join(dir, destFilename);
  await sharp(inputBuffer)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(outPath);
}

export async function processFileFromDisk(
  sourcePath: string,
  gradSlug: string,
  destFilename: string,
): Promise<void> {
  const buf = await fs.promises.readFile(sourcePath);
  await processAndSaveImage(buf, gradSlug, destFilename);
}
