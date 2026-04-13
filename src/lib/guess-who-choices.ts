import { GRAD_SLUGS } from "./constants";

const DISPLAY_BY_SLUG: Record<(typeof GRAD_SLUGS)[number], string> = {
  solie: "Solie",
  diego: "Diego",
  levi: "Levi",
  lars: "Lars",
  lucia: "Lucia",
};

/** Display names for multiple-choice Guess Who (must match game + CSV). */
export const GUESS_WHO_DISPLAY_NAMES: readonly string[] = GRAD_SLUGS.map(
  (s) => DISPLAY_BY_SLUG[s],
);

export function wrongAnswersForGuessWho(correctDisplayName: string): string[] {
  const t = correctDisplayName.trim();
  return GUESS_WHO_DISPLAY_NAMES.filter((n) => n !== t);
}

export function isValidGuessWhoAnswer(name: string): boolean {
  return GUESS_WHO_DISPLAY_NAMES.includes(name.trim());
}
