/**
 * Run after: npx drizzle-kit push
 * Usage: npx tsx scripts/seed.ts [--force]
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { sql } from "drizzle-orm";
import { db } from "../src/db";
import {
  gradImages,
  grads,
  playerAnswers,
  players,
  questions,
} from "../src/db/schema";
import { processFileFromDisk } from "../src/lib/image-process";
import { UPLOADS_ROOT } from "../src/lib/paths";
import { GUESS_SLUG } from "../src/lib/constants";

const GRAD_ROWS = [
  { slug: "solie", name: "Solie", graduationLevel: "Middle School" },
  { slug: "diego", name: "Diego", graduationLevel: "High School" },
  { slug: "levi", name: "Levi", graduationLevel: "High School" },
  { slug: "lars", name: "Lars", graduationLevel: "College" },
  { slug: "lucia", name: "Lucia", graduationLevel: "Masters" },
] as const;

async function main() {
  const force = process.argv.includes("--force");

  if (!fs.existsSync(path.join(process.cwd(), "data"))) {
    fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_ROOT)) {
    fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
  }

  const [{ n: qCount }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(questions);

  if (qCount > 0 && !force) {
    console.log("Database already has questions. Use --force to re-seed.");
    return;
  }

  if (force) {
    await db.delete(playerAnswers);
    await db.delete(players);
    await db.delete(questions);
    await db.delete(gradImages);
    await db.delete(grads);
  }

  await db.insert(grads).values([...GRAD_ROWS]);

  const csvPath = path.join(process.cwd(), "test-questions.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  for (const row of records) {
    const gradCol = row["Grad"] ?? row["grad"];
    const qtext = row["Question"];
    const answer = row["Answer"];
    const w1 = row["Wrong Answer 1"];
    const w2 = row["Wrong Answer 2"];
    const w3 = row["Wrong Answer 3"];
    const w4 = row["Wrong Answer 4"];
    const wrongs = [w1, w2, w3, w4].filter((w) => w && w.trim().length > 0);

    const g = (gradCol ?? "").trim();
    const gradSlug =
      g.toLowerCase() === "guess" ? GUESS_SLUG : g.toLowerCase();
    const type = gradSlug === GUESS_SLUG ? "guess_who" : "standard";

    await db.insert(questions).values({
      gradSlug,
      questionText: qtext,
      correctAnswer: answer,
      wrongAnswers: JSON.stringify(wrongs),
      type,
    });
  }

  const imagesRoot = path.join(process.cwd(), "images");
  for (const { slug } of GRAD_ROWS) {
    const dir = path.join(imagesRoot, slug);
    if (!fs.existsSync(dir)) {
      console.warn(`No images folder: ${dir}`);
      continue;
    }
    const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
    let seq = 0;
    for (const file of files) {
      seq += 1;
      const destName = `photo-${seq}.jpg`;
      const src = path.join(dir, file);
      await processFileFromDisk(src, slug, destName);
      await db.insert(gradImages).values({
        gradSlug: slug,
        filename: destName,
      });
    }
  }

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
