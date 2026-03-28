import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Habit, HabitLog } from "@/types/database";

const HABIT_KEYS = {
  all: ["habits"] as const,
  byClient: (clientId: string) => [...HABIT_KEYS.all, clientId] as const,
  logs: (habitId: string, startDate: string, endDate: string) =>
    [...HABIT_KEYS.all, "logs", habitId, startDate, endDate] as const,
};

export function useClientHabits(clientId: string) {
  return useQuery({
    queryKey: HABIT_KEYS.byClient(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!clientId,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (habit: {
      coach_id: string;
      client_id: string;
      name: string;
      description?: string;
      frequency: Habit["frequency"];
    }) => {
      const { data, error } = await supabase
        .from("habits")
        .insert(habit)
        .select()
        .single();
      if (error) throw error;
      return data as Habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABIT_KEYS.all });
    },
  });
}

export function useHabitLogs(habitId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: HABIT_KEYS.logs(habitId, startDate, endDate),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("habit_logs")
        .select("*")
        .eq("habit_id", habitId)
        .gte("logged_date", startDate)
        .lte("logged_date", endDate)
        .order("logged_date", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data as HabitLog[];
    },
    enabled: !!habitId,
  });
}

export function useToggleHabitLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      habitId,
      date,
      completed,
    }: {
      habitId: string;
      date: string;
      completed: boolean;
    }) => {
      const { error } = await supabase
        .from("habit_logs")
        .upsert(
          { habit_id: habitId, logged_date: date, completed },
          { onConflict: "habit_id,logged_date" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABIT_KEYS.all });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABIT_KEYS.all });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      frequency,
    }: {
      id: string;
      name?: string;
      description?: string | null;
      frequency?: string;
    }) => {
      const { data, error } = await supabase
        .from("habits")
        .update({ name, description, frequency })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABIT_KEYS.all });
    },
  });
}
