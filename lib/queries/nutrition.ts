import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { NutritionLog, MacroGoals } from "@/types/database";

const NUTRITION_KEYS = {
  all: ["nutrition"] as const,
  byDate: (clientId: string, date: string) =>
    [...NUTRITION_KEYS.all, clientId, date] as const,
};

export function useNutritionLogs(clientId: string, date: string) {
  return useQuery({
    queryKey: NUTRITION_KEYS.byDate(clientId, date),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nutrition_logs")
        .select("*")
        .eq("client_id", clientId)
        .eq("logged_date", date)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as NutritionLog[];
    },
    enabled: !!clientId && !!date,
  });
}

export function useAddNutritionLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: {
      client_id: string;
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      meal: string;
      logged_date: string;
    }) => {
      const { data, error } = await supabase
        .from("nutrition_logs")
        .insert(entry)
        .select()
        .single();
      if (error) throw error;
      return data as NutritionLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NUTRITION_KEYS.all });
    },
  });
}

export function useDeleteNutritionLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("nutrition_logs")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NUTRITION_KEYS.all });
    },
  });
}

export function useUpdateNutritionGoals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      goals,
    }: {
      userId: string;
      goals: MacroGoals;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ nutrition_goals: goals })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NUTRITION_KEYS.all });
    },
  });
}
