import type { InferSelectModel } from "drizzle-orm";
import { questions } from "@/db/schema";
import { shuffledCopy } from "./shuffle";

export type QuestionRow = InferSelectModel<typeof questions>;

export function parseWrongAnswers(json: string): string[] {
  return JSON.parse(json) as string[];
}

export function buildShuffledChoices(question: QuestionRow): string[] {
  const wrongs = parseWrongAnswers(question.wrongAnswers);
  return shuffledCopy([question.correctAnswer, ...wrongs]);
}

export function answersMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
