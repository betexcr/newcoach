import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Exercise } from "@/types/database";

const EXERCISE_KEYS = {
  all: ["exercises"] as const,
  list: (filters?: ExerciseFilters) => [...EXERCISE_KEYS.all, "list", filters] as const,
  detail: (id: string) => [...EXERCISE_KEYS.all, "detail", id] as const,
};

export interface ExerciseFilters {
  search?: string;
  muscleGroup?: string;
  equipment?: string;
}

export function useExercises(filters?: ExerciseFilters) {
  return useQuery({
    queryKey: EXERCISE_KEYS.list(filters),
    queryFn: async () => {
      let query = supabase
        .from("exercises")
        .select("*")
        .order("name", { ascending: true })
        .limit(500);

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      if (filters?.muscleGroup && filters.muscleGroup !== "all") {
        query = query.eq("muscle_group", filters.muscleGroup);
      }

      if (filters?.equipment && filters.equipment !== "all") {
        query = query.eq("equipment", filters.equipment);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Exercise[];
    },
  });
}

export function useExercisesByIds(ids: string[]) {
  return useQuery({
    queryKey: [...EXERCISE_KEYS.all, "byIds", [...ids].sort()],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .in("id", ids);
      if (error) throw error;
      return data as Exercise[];
    },
    enabled: ids.length > 0,
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: EXERCISE_KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Exercise;
    },
    enabled: !!id,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exercise: {
      name: string;
      description?: string;
      muscle_group: string;
      equipment?: string;
      video_url?: string;
      thumbnail_url?: string;
      created_by: string;
      is_custom: boolean;
    }) => {
      const { data, error } = await supabase
        .from("exercises")
        .insert(exercise)
        .select()
        .single();
      if (error) throw error;
      return data as Exercise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXERCISE_KEYS.all });
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Exercise> & { id: string }) => {
      const { data, error } = await supabase
        .from("exercises")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Exercise;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EXERCISE_KEYS.all });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXERCISE_KEYS.all });
    },
  });
}

export const MUSCLE_GROUPS = [
  "all",
  "chest",
  "back",
  "shoulders",
  "legs",
  "arms",
  "core",
  "cardio",
] as const;

export const EQUIPMENT_OPTIONS = [
  "all",
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "bodyweight",
  "kettlebell",
  "other",
] as const;
