import type { AssignedWorkout } from "@/types/database";

export function computeStreak(workouts: AssignedWorkout[]): number {
  const dates = [
    ...new Set(
      workouts
        .filter((w) => w.status === "completed")
        .map((w) => w.scheduled_date)
    ),
  ].sort((a, b) => b.localeCompare(a));

  let count = 0;
  const today = new Date();
  for (let i = 0; i < dates.length; i++) {
    const wd = new Date(dates[i] + "T12:00:00");
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    if (wd.toDateString() === expected.toDateString()) {
      count++;
    } else break;
  }
  return count;
}

export function computeMaxStreak(workouts: AssignedWorkout[]): number {
  const dates = [
    ...new Set(
      workouts
        .filter((w) => w.status === "completed")
        .map((w) => w.scheduled_date)
    ),
  ].sort();

  if (dates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + "T12:00:00");
    const curr = new Date(dates[i] + "T12:00:00");
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );
    currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
    maxStreak = Math.max(maxStreak, currentStreak);
  }
  return maxStreak;
}
