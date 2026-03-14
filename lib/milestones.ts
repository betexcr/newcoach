import type { AssignedWorkout, WorkoutResult } from "@/types/database";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
}

export function computeMilestones(
  workouts: AssignedWorkout[],
  results: WorkoutResult[]
): Milestone[] {
  const completedWorkouts = workouts.filter((w) => w.status === "completed");
  const completedCount = completedWorkouts.length;

  const sortedCompleted = [...completedWorkouts].sort((a, b) =>
    a.scheduled_date.localeCompare(b.scheduled_date)
  );

  let maxStreak = 0;
  let currentStreak = 0;
  for (let i = 0; i < sortedCompleted.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const prev = new Date(sortedCompleted[i - 1].scheduled_date + "T12:00:00");
      const curr = new Date(sortedCompleted[i].scheduled_date + "T12:00:00");
      const diffDays =
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      currentStreak = diffDays <= 2 ? currentStreak + 1 : 1;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
  }

  let maxWeight = 0;
  for (const result of results) {
    const logged = result.logged_sets;
    if (!Array.isArray(logged)) continue;
    for (const ex of logged as any[]) {
      for (const set of ex.sets ?? []) {
        if (set.weight && set.weight > maxWeight) {
          maxWeight = set.weight;
        }
      }
    }
  }

  const milestones: Milestone[] = [
    {
      id: "first-workout",
      title: "First Steps",
      description: "Complete your first workout",
      icon: "shoe-print",
      earned: completedCount >= 1,
      earnedDate: sortedCompleted[0]?.scheduled_date,
    },
    {
      id: "five-workouts",
      title: "Getting Started",
      description: "Complete 5 workouts",
      icon: "star-outline",
      earned: completedCount >= 5,
    },
    {
      id: "ten-workouts",
      title: "Dedicated",
      description: "Complete 10 workouts",
      icon: "star-half-full",
      earned: completedCount >= 10,
    },
    {
      id: "twentyfive-workouts",
      title: "Committed",
      description: "Complete 25 workouts",
      icon: "star",
      earned: completedCount >= 25,
    },
    {
      id: "fifty-workouts",
      title: "Unstoppable",
      description: "Complete 50 workouts",
      icon: "trophy",
      earned: completedCount >= 50,
    },
    {
      id: "hundred-workouts",
      title: "Century Club",
      description: "Complete 100 workouts",
      icon: "medal",
      earned: completedCount >= 100,
    },
    {
      id: "seven-day-streak",
      title: "Week Warrior",
      description: "7-day workout streak",
      icon: "fire",
      earned: maxStreak >= 7,
    },
    {
      id: "thirty-day-streak",
      title: "Month of Iron",
      description: "30-day workout streak",
      icon: "lightning-bolt",
      earned: maxStreak >= 30,
    },
    {
      id: "pr-100",
      title: "Heavy Hitter",
      description: "Lift 100+ lbs in a single set",
      icon: "weight-lifter",
      earned: maxWeight >= 100,
    },
    {
      id: "pr-200",
      title: "Beast Mode",
      description: "Lift 200+ lbs in a single set",
      icon: "arm-flex",
      earned: maxWeight >= 200,
    },
    {
      id: "pr-300",
      title: "Elite Lifter",
      description: "Lift 300+ lbs in a single set",
      icon: "shield-star",
      earned: maxWeight >= 300,
    },
  ];

  return milestones;
}
