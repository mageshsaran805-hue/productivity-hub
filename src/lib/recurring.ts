/**
 * Pure recurring-task rollover logic. No Next.js or DB imports so it can be
 * unit-tested in a plain Node environment.
 */

/**
 * Advances a recurring task's due date per its rule. Rules are simple interval
 * strings: "daily" | "weekly" | "monthly" | "yearly" (optionally "N<unit>" for
 * custom intervals, e.g. "3daily" → every 3 days). Falls back to the start date
 * when a task has a rule but no due date.
 */
export function nextOccurrence(task: {
  due_date: string | null;
  start_date: string | null;
  recurring_rule: string | null;
  is_recurring: boolean;
}): string | null {
  if (!task.is_recurring || !task.recurring_rule) return null;
  const rule = task.recurring_rule.trim().toLowerCase();
  if (!rule || rule === "none") return null;

  let interval = 1;
  let unit = rule;
  const match = rule.match(/^(\d+)?(daily|weekly|monthly|yearly)$/);
  if (match) {
    interval = match[1] ? Number(match[1]) : 1;
    unit = match[2];
  }

  const base = new Date(task.due_date ?? task.start_date ?? new Date());
  if (Number.isNaN(base.getTime())) return null;

  const next = new Date(base);
  switch (unit) {
    case "daily":
      next.setDate(next.getDate() + interval);
      break;
    case "weekly":
      next.setDate(next.getDate() + interval * 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + interval);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + interval);
      break;
    default:
      return null;
  }
  return next.toISOString();
}