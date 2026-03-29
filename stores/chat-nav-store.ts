import { create } from "zustand";

interface ChatNavState {
  conversationId: string | null;
  name: string | null;
  set: (conversationId: string, name: string) => void;
  clear: () => void;
}

export const useChatNavStore = create<ChatNavState>((set) => ({
  conversationId: null,
  name: null,
  set: (conversationId, name) => set({ conversationId, name }),
  clear: () => set({ conversationId: null, name: null }),
}));
