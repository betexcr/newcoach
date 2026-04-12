import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { BodyMetric } from "@/types/database";

const BODY_METRIC_KEYS = {
  all: ["body_metrics"] as const,
  byClient: (clientId: string) => [...BODY_METRIC_KEYS.all, clientId] as const,
};

export function useBodyMetrics(clientId: string) {
  return useQuery({
    queryKey: BODY_METRIC_KEYS.byClient(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("body_metrics")
        .select("*")
        .eq("client_id", clientId)
        .order("logged_date", { ascending: false })
        .limit(365);
      if (error) throw error;
      return data as BodyMetric[];
    },
    enabled: !!clientId,
  });
}

export function useAddBodyMetric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (metric: {
      client_id: string;
      logged_date: string;
      weight?: number | null;
      body_fat?: number | null;
      chest?: number | null;
      waist?: number | null;
      hips?: number | null;
      biceps?: number | null;
      thighs?: number | null;
    }) => {
      const { data, error } = await supabase
        .from("body_metrics")
        .upsert(metric, { onConflict: "client_id,logged_date" })
        .select()
        .single();
      if (error) throw error;
      return data as BodyMetric;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BODY_METRIC_KEYS.all });
    },
  });
}

export function useUpdateBodyMetric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      weight?: number | null;
      body_fat?: number | null;
      chest?: number | null;
      waist?: number | null;
      hips?: number | null;
      biceps?: number | null;
      thighs?: number | null;
    }) => {
      const { data, error } = await supabase
        .from("body_metrics")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as BodyMetric;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BODY_METRIC_KEYS.all });
    },
  });
}

export function useDeleteBodyMetric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("body_metrics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BODY_METRIC_KEYS.all });
    },
  });
}
