import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { WorkoutTemplate, AssignedWorkout, WorkoutExercise } from "@/types/database";

const WORKOUT_KEYS = {
  templates: ["workout-templates"] as const,
  templateList: (coachId: string) => [...WORKOUT_KEYS.templates, coachId] as const,
  assigned: ["assigned-workouts"] as const,
  assignedByClient: (clientId: string) => [...WORKOUT_KEYS.assigned, "client", clientId] as const,
  assignedByCoach: (coachId: string) => [...WORKOUT_KEYS.assigned, "coach", coachId] as const,
  assignedByDate: (clientId: string, date: string) => [...WORKOUT_KEYS.assigned, "date", clientId, date] as const,
};

export function useWorkoutTemplates(coachId: string) {
  return useQuery({
    queryKey: WORKOUT_KEYS.templateList(coachId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_templates")
        .select("*")
        .eq("coach_id", coachId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as WorkoutTemplate[];
    },
    enabled: !!coachId,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: {
      coach_id: string;
      name: string;
      description?: string;
      exercises: WorkoutExercise[];
    }) => {
      const { data, error } = await supabase
        .from("workout_templates")
        .insert(template)
        .select()
        .single();
      if (error) throw error;
      return data as WorkoutTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.templates });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<WorkoutTemplate>) => {
      const { data, error } = await supabase
        .from("workout_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as WorkoutTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.templates });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workout_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.templates });
    },
  });
}

export function useAssignWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workout: {
      coach_id: string;
      client_id: string;
      name: string;
      scheduled_date: string;
      exercises: WorkoutExercise[];
      program_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("assigned_workouts")
        .insert(workout)
        .select()
        .single();
      if (error) throw error;
      return data as AssignedWorkout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.assigned });
    },
  });
}

export function useClientWorkouts(clientId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...WORKOUT_KEYS.assignedByClient(clientId), startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("assigned_workouts")
        .select("*")
        .eq("client_id", clientId)
        .order("scheduled_date", { ascending: true });

      if (startDate) query = query.gte("scheduled_date", startDate);
      if (endDate) query = query.lte("scheduled_date", endDate);

      const { data, error } = await query;
      if (error) throw error;
      return data as AssignedWorkout[];
    },
    enabled: !!clientId,
  });
}

export function useWorkoutById(workoutId: string) {
  return useQuery({
    queryKey: [...WORKOUT_KEYS.assigned, "single", workoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assigned_workouts")
        .select("*")
        .eq("id", workoutId)
        .single();
      if (error) throw error;
      return data as AssignedWorkout;
    },
    enabled: !!workoutId,
  });
}

export function useCoachWorkoutsToday(coachId: string) {
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: [...WORKOUT_KEYS.assignedByCoach(coachId), "today", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assigned_workouts")
        .select("*")
        .eq("coach_id", coachId)
        .eq("scheduled_date", today)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AssignedWorkout[];
    },
    enabled: !!coachId,
  });
}

export function useCoachRecentWorkouts(coachId: string, limit = 10) {
  return useQuery({
    queryKey: [...WORKOUT_KEYS.assignedByCoach(coachId), "recent", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assigned_workouts")
        .select("*")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as AssignedWorkout[];
    },
    enabled: !!coachId,
  });
}

export function useUpdateWorkoutStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("assigned_workouts")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as AssignedWorkout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKOUT_KEYS.assigned });
    },
  });
}
