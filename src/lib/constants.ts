/** Slugs used in DB and image folders (lowercase) */
export const GRAD_SLUGS = [
  "solie",
  "diego",
  "levi",
  "lars",
  "lucia",
] as const;

export type GradSlug = (typeof GRAD_SLUGS)[number];

export const GUESS_SLUG = "guess" as const;
