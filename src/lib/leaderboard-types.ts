/** Row from GET /api/game/leaderboard */
export type LeaderboardRow = {
  name: string;
  correct: number;
  answered: number;
};

export function formatLeaderScore(row: LeaderboardRow): string {
  return `${row.correct} / ${row.answered}`;
}
