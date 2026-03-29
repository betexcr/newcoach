import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { CoachClient, Profile } from "@/types/database";

const CLIENT_KEYS = {
  all: ["clients"] as const,
  list: (coachId: string) => [...CLIENT_KEYS.all, coachId] as const,
  profile: (clientId: string) => [...CLIENT_KEYS.all, "profile", clientId] as const,
  invites: (clientId: string) => [...CLIENT_KEYS.all, "invites", clientId] as const,
};

export interface ClientWithProfile {
  id: string;
  coach_id: string;
  client_id: string;
  status: CoachClient["status"];
  created_at: string;
  profile: Profile;
}

export function useCoachClients(coachId: string) {
  return useQuery({
    queryKey: CLIENT_KEYS.list(coachId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_clients")
        .select("*, profile:profiles!coach_clients_client_id_fkey(*)")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return ((data ?? []) as Array<ClientWithProfile | { profile: null }>).filter(
        (row): row is ClientWithProfile => row.profile != null
      );
    },
    enabled: !!coachId,
  });
}

export function useAddClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      coachId,
      clientEmail,
    }: {
      coachId: string;
      clientEmail: string;
    }) => {
      const { data: clientProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", clientEmail.toLowerCase())
        .single();

      if (profileError || !clientProfile) {
        throw new Error("CLIENT_NOT_FOUND");
      }

      const { data, error } = await supabase
        .from("coach_clients")
        .insert({
          coach_id: coachId,
          client_id: clientProfile.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("CLIENT_ALREADY_LINKED");
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all });
    },
  });
}

export function useRemoveClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coach_clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all });
    },
  });
}

export interface InviteWithCoach {
  id: string;
  coach_id: string;
  client_id: string;
  status: string;
  created_at: string;
  coach: Profile;
}

export function usePendingInvites(clientId: string) {
  return useQuery({
    queryKey: CLIENT_KEYS.invites(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_clients")
        .select("*, coach:profiles!coach_clients_coach_id_fkey(*)")
        .eq("client_id", clientId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as InviteWithCoach[];
    },
    enabled: !!clientId,
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("coach_clients")
        .update({ status: "active" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all });
    },
  });
}

export function useDeclineInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("coach_clients")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_KEYS.all });
    },
  });
}
