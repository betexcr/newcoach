import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Organization } from "@/types/database";

const ORG_KEYS = {
  all: ["organizations"] as const,
  detail: (orgId: string) => [...ORG_KEYS.all, orgId] as const,
};

export function useOrganization(orgId: string) {
  return useQuery({
    queryKey: ORG_KEYS.detail(orgId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();
      if (error) throw error;
      return data as Organization;
    },
    enabled: !!orgId,
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Organization> & { id: string }) => {
      const { data, error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Organization;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORG_KEYS.detail(data.id) });
    },
  });
}
