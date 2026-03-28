import type { TFunction } from "i18next";
import type { AssignedWorkout, WorkoutResult } from "@/types/database";
import { computeMaxStreak } from "@/lib/streak";

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
  results: WorkoutResult[],
  t: TFunction
): Milestone[] {
  const completedWorkouts = workouts.filter((w) => w.status === "completed");
  const completedCount = completedWorkouts.length;

  const maxStreak = computeMaxStreak(workouts);

  let maxWeight = 0;
  for (const result of results) {
    const logged = result.logged_sets;
    if (!Array.isArray(logged)) continue;
    for (const ex of logged) {
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
      title: t("milestones.firstSteps.title"),
      description: t("milestones.firstSteps.description"),
      icon: "shoe-print",
      earned: completedCount >= 1,
      earnedDate: completedWorkouts.length > 0
        ? [...completedWorkouts].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))[0]?.scheduled_date
        : undefined,
    },
    {
      id: "five-workouts",
      title: t("milestones.gettingStarted.title"),
      description: t("milestones.gettingStarted.description"),
      icon: "star-outline",
      earned: completedCount >= 5,
    },
    {
      id: "ten-workouts",
      title: t("milestones.dedicated.title"),
      description: t("milestones.dedicated.description"),
      icon: "star-half-full",
      earned: completedCount >= 10,
    },
    {
      id: "twentyfive-workouts",
      title: t("milestones.committed.title"),
      description: t("milestones.committed.description"),
      icon: "star",
      earned: completedCount >= 25,
    },
    {
      id: "fifty-workouts",
      title: t("milestones.unstoppable.title"),
      description: t("milestones.unstoppable.description"),
      icon: "trophy",
      earned: completedCount >= 50,
    },
    {
      id: "hundred-workouts",
      title: t("milestones.centuryClub.title"),
      description: t("milestones.centuryClub.description"),
      icon: "medal",
      earned: completedCount >= 100,
    },
    {
      id: "seven-day-streak",
      title: t("milestones.weekWarrior.title"),
      description: t("milestones.weekWarrior.description"),
      icon: "fire",
      earned: maxStreak >= 7,
    },
    {
      id: "thirty-day-streak",
      title: t("milestones.monthOfIron.title"),
      description: t("milestones.monthOfIron.description"),
      icon: "lightning-bolt",
      earned: maxStreak >= 30,
    },
    {
      id: "pr-100",
      title: t("milestones.heavyHitter.title"),
      description: t("milestones.heavyHitter.description"),
      icon: "weight-lifter",
      earned: maxWeight >= 100,
    },
    {
      id: "pr-200",
      title: t("milestones.beastMode.title"),
      description: t("milestones.beastMode.description"),
      icon: "arm-flex",
      earned: maxWeight >= 200,
    },
    {
      id: "pr-300",
      title: t("milestones.eliteLifter.title"),
      description: t("milestones.eliteLifter.description"),
      icon: "shield-star",
      earned: maxWeight >= 300,
    },
  ];

  return milestones;
}
