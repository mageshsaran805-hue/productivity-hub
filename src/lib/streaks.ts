/** Compute current + best streak (consecutive completed days) for habits.
 *  Dates are plain "YYYY-MM-DD" strings. Current streak counts backward from
 *  `today` (or yesterday if today not yet completed, so an unfinished today
 *  doesn't break the streak). */

const DAY_MS = 86400000;

function shiftDay(dateStr: string, delta: number) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().split("T")[0];
}

export function computeStreaks(
  completedByHabit: Map<string, Set<string>>,
  habitIds: string[],
  todayStr?: string
): Record<string, { current_streak: number; best_streak: number }> {
  const streaks: Record<string, { current_streak: number; best_streak: number }> = {};
  let today = todayStr;
  if (!today) {
    today = new Date().toISOString().split("T")[0];
  }

  for (const id of habitIds) {
    const set = completedByHabit.get(id) ?? new Set<string>();
    const sorted = [...set].sort();

    // best streak
    let best = 0;
    let run = 0;
    let prev: string | null = null;
    for (const dateStr of sorted) {
      if (prev && shiftDay(prev, 1) === dateStr) {
        run += 1;
      } else {
        run = 1;
      }
      best = Math.max(best, run);
      prev = dateStr;
    }

    // current streak
    let current = 0;
    let cursor = set.has(today) ? today : shiftDay(today, -1);
    while (set.has(cursor)) {
      current += 1;
      cursor = shiftDay(cursor, -1);
    }

    streaks[id] = { current_streak: current, best_streak: best };
  }
  return streaks;
}