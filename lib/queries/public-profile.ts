import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

const PROFILE_KEYS = {
  public: (slug: string) => ["public-profile", slug] as const,
};

export function usePublicProfile(slug: string) {
  return useQuery({
    queryKey: PROFILE_KEYS.public(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url,bio,specialties,public_slug")
        .eq("public_slug", slug)
        .single();
      if (error) throw error;
      return data as Pick<Profile, "id" | "full_name" | "avatar_url" | "bio" | "specialties" | "public_slug">;
    },
    enabled: !!slug,
  });
}

export function useUpdateCoachProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; public_slug?: string | null; bio?: string | null; specialties?: string[] | null }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-profile"] });
    },
  });
}
