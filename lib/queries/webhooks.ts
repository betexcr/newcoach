import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Webhook, WebhookEventType } from "@/types/database";

const WEBHOOK_KEYS = {
  all: ["webhooks"] as const,
  list: (coachId: string) => [...WEBHOOK_KEYS.all, coachId] as const,
};

export function useWebhooks(coachId: string) {
  return useQuery({
    queryKey: WEBHOOK_KEYS.list(coachId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhooks")
        .select("*")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Webhook[];
    },
    enabled: !!coachId,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      coach_id,
      event_type,
      url,
      secret,
    }: {
      coach_id: string;
      event_type: WebhookEventType;
      url: string;
      secret?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("webhooks")
        .insert({ coach_id, event_type, url, secret })
        .select()
        .single();
      if (error) throw error;
      return data as Webhook;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_KEYS.list(variables.coach_id) });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      coach_id,
      ...updates
    }: {
      id: string;
      coach_id: string;
      url?: string;
      active?: boolean;
      secret?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("webhooks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Webhook;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_KEYS.list(variables.coach_id) });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, coach_id }: { id: string; coach_id: string }) => {
      const { error } = await supabase.from("webhooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_KEYS.list(variables.coach_id) });
    },
  });
}
