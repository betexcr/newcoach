import { QueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
    mutations: {
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
        Alert.alert("Error", message);
      },
    },
  },
});
