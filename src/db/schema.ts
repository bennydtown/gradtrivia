import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const grads = sqliteTable("grads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  graduationLevel: text("graduation_level").notNull(),
});

export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gradSlug: text("grad_slug").notNull(),
  questionText: text("question_text").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  wrongAnswers: text("wrong_answers").notNull(),
  type: text("type").notNull(),
});

export const gradImages = sqliteTable("grad_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gradSlug: text("grad_slug").notNull(),
  filename: text("filename").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  displayName: text("display_name").notNull(),
  sessionToken: text("session_token").notNull().unique(),
  questionOrder: text("question_order").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
});

export const playerAnswers = sqliteTable("player_answers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  selectedAnswer: text("selected_answer").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  /** Which grad this question counts toward for per-grad scores */
  attributedGradSlug: text("attributed_grad_slug").notNull(),
  answeredAt: integer("answered_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
