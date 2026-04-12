import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
    mutations: {
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : "Unknown mutation error";
        console.warn("Unhandled mutation error:", message);
      },
    },
  },
});
