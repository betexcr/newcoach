import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { WorkoutResult, LoggedExercise } from "@/types/database";

const RESULT_KEYS = {
  all: ["workout-results"] as const,
  byClient: (clientId: string) => [...RESULT_KEYS.all, clientId] as const,
  byWorkout: (workoutId: string) => [...RESULT_KEYS.all, "workout", workoutId] as const,
  exerciseHistory: (clientId: string, exerciseId: string) =>
    [...RESULT_KEYS.all, "exercise-history", clientId, exerciseId] as const,
};

export function useWorkoutResult(workoutId: string) {
  return useQuery({
    queryKey: RESULT_KEYS.byWorkout(workoutId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_results")
        .select("*")
        .eq("assigned_workout_id", workoutId)
        .maybeSingle();
      if (error) throw error;
      return data as WorkoutResult | null;
    },
    enabled: !!workoutId,
  });
}

export function useClientResults(clientId: string) {
  return useQuery({
    queryKey: RESULT_KEYS.byClient(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_results")
        .select("*")
        .eq("client_id", clientId)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return data as WorkoutResult[];
    },
    enabled: !!clientId,
  });
}

export function useSaveResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (result: {
      assigned_workout_id: string;
      client_id: string;
      logged_sets: LoggedExercise[];
      notes?: string;
    }) => {
      const { data: existing } = await supabase
        .from("workout_results")
        .select("id")
        .eq("assigned_workout_id", result.assigned_workout_id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("workout_results")
          .update({
            logged_sets: result.logged_sets,
            notes: result.notes,
            completed_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as WorkoutResult;
      }

      const { data, error } = await supabase
        .from("workout_results")
        .insert(result)
        .select()
        .single();
      if (error) throw error;
      return data as WorkoutResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESULT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["assigned-workouts"] });
    },
  });
}

export function useExerciseHistory(clientId: string, exerciseName: string) {
  return useQuery({
    queryKey: RESULT_KEYS.exerciseHistory(clientId, exerciseName),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_results")
        .select("*")
        .eq("client_id", clientId)
        .order("completed_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const results = data as WorkoutResult[];
      const history: {
        date: string;
        sets: { reps: number | null; weight: number | null }[];
      }[] = [];

      for (const result of results) {
        const logged = result.logged_sets as LoggedExercise[];
        if (!Array.isArray(logged)) continue;

        const match = logged.find(
          (ex) => ex.exercise_name === exerciseName
        );
        if (match) {
          history.push({
            date: result.completed_at,
            sets: match.sets.map((s) => ({
              reps: s.reps,
              weight: s.weight,
            })),
          });
        }
      }

      return history;
    },
    enabled: !!clientId && !!exerciseName,
  });
}
