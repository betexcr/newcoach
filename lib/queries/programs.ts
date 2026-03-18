import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Program, ProgramWorkout, WorkoutExercise } from "@/types/database";

const PROGRAM_KEYS = {
  all: ["programs"] as const,
  list: (coachId: string) => [...PROGRAM_KEYS.all, coachId] as const,
  detail: (id: string) => [...PROGRAM_KEYS.all, "detail", id] as const,
  workouts: (programId: string) => [...PROGRAM_KEYS.all, "workouts", programId] as const,
};

export function usePrograms(coachId: string) {
  return useQuery({
    queryKey: PROGRAM_KEYS.list(coachId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("coach_id", coachId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Program[];
    },
    enabled: !!coachId,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (program: {
      coach_id: string;
      name: string;
      description?: string;
      duration_weeks: number;
    }) => {
      const { data, error } = await supabase
        .from("programs")
        .insert(program)
        .select()
        .single();
      if (error) throw error;
      return data as Program;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRAM_KEYS.all });
    },
  });
}

export function useProgramWorkouts(programId: string) {
  return useQuery({
    queryKey: PROGRAM_KEYS.workouts(programId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_workouts")
        .select("*")
        .eq("program_id", programId)
        .order("week_number", { ascending: true })
        .order("day_number", { ascending: true });
      if (error) throw error;
      return data as ProgramWorkout[];
    },
    enabled: !!programId,
  });
}

export function useCreateProgramWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workout: {
      program_id: string;
      week_number: number;
      day_number: number;
      name: string;
      exercises: WorkoutExercise[];
    }) => {
      const { data, error } = await supabase
        .from("program_workouts")
        .insert(workout)
        .select()
        .single();
      if (error) throw error;
      return data as ProgramWorkout;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PROGRAM_KEYS.workouts(variables.program_id),
      });
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRAM_KEYS.all });
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      description?: string | null;
      duration_weeks?: number;
    }) => {
      const { data, error } = await supabase
        .from("programs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Program;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRAM_KEYS.all });
    },
  });
}

export function useDeleteProgramWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      programId,
    }: {
      id: string;
      programId: string;
    }) => {
      const { error } = await supabase
        .from("program_workouts")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return programId;
    },
    onSuccess: (programId) => {
      queryClient.invalidateQueries({
        queryKey: PROGRAM_KEYS.workouts(programId),
      });
    },
  });
}
