import { GUESS_SLUG, type GradSlug } from "./constants";

const NAME_TO_SLUG: Record<string, GradSlug> = {
  solie: "solie",
  diego: "diego",
  levi: "levi",
  lars: "lars",
  lucia: "lucia",
};

export function answerTextToGradSlug(answer: string): GradSlug | null {
  const key = answer.trim().toLowerCase();
  return NAME_TO_SLUG[key] ?? null;
}

/** For Guess Who image: show photo of the grad the player selected (by display name). */
export function selectedAnswerToImageSlug(
  selectedAnswer: string,
): GradSlug | null {
  return answerTextToGradSlug(selectedAnswer);
}

/**
 * Which grad bucket a question counts toward for per-grad scores.
 * Standard: the grad the question is about. Guess Who: the correct answer's grad.
 */
export function attributedGradSlug(
  gradSlug: string,
  questionType: string,
  correctAnswer: string,
): GradSlug {
  if (questionType === "guess_who") {
    const s = answerTextToGradSlug(correctAnswer);
    if (s) return s;
  }
  if (gradSlug === GUESS_SLUG) {
    throw new Error("guess_who without valid correct answer");
  }
  return gradSlug as GradSlug;
}
