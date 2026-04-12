import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Subscription } from "@/types/database";

const BILLING_KEYS = {
  all: ["billing"] as const,
  subscription: (coachId: string) => [...BILLING_KEYS.all, coachId] as const,
};

export function useSubscription(coachId: string) {
  return useQuery({
    queryKey: BILLING_KEYS.subscription(coachId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("coach_id", coachId)
        .maybeSingle();
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!coachId,
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async ({
      plan,
      successUrl,
      cancelUrl,
    }: {
      plan: string;
      successUrl?: string;
      cancelUrl?: string;
    }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plan, successUrl, cancelUrl }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      return url as string;
    },
  });
}

export function useOpenCustomerPortal() {
  return useMutation({
    mutationFn: async ({ returnUrl }: { returnUrl?: string }) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/customer-portal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ returnUrl }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to open customer portal");
      }

      const { url } = await response.json();
      return url as string;
    },
  });
}
