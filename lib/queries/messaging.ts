import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Conversation, Message } from "@/types/database";

const MSG_KEYS = {
  conversations: (userId: string) => ["conversations", userId] as const,
  messages: (conversationId: string) => ["messages", conversationId] as const,
};

export interface ConversationWithLastMessage extends Conversation {
  last_message?: Message;
  participants?: { user_id: string; full_name: string; avatar_url: string | null }[];
}

export function useConversations(userId: string) {
  return useQuery({
    queryKey: MSG_KEYS.conversations(userId),
    queryFn: async () => {
      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);

      if (partError) throw partError;
      if (!participations?.length) return [];

      const ids = participations.map((p) => p.conversation_id);

      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("*")
        .in("id", ids)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const convos = conversations as Conversation[];

      const { data: allRecentMessages, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", ids)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (msgError) throw msgError;

      const msgMap: Record<string, Message> = {};
      for (const msg of (allRecentMessages ?? []) as Message[]) {
        if (!msgMap[msg.conversation_id]) {
          msgMap[msg.conversation_id] = msg;
        }
      }

      return convos.map((c) => ({
        ...c,
        last_message: msgMap[c.id],
      })) as ConversationWithLastMessage[];
    },
    enabled: !!userId,
  });
}

export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: MSG_KEYS.messages(conversationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as Message[]).reverse();
    },
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          queryClient.setQueryData(
            MSG_KEYS.messages(conversationId),
            (old: Message[] = []) => {
              if (old.some((m) => m.id === newMsg.id)) return old;
              return [...old, newMsg];
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: {
      conversation_id: string;
      sender_id: string;
      body?: string;
      voice_url?: string;
      image_url?: string;
    }) => {
      const { data, error } = await supabase
        .from("messages")
        .insert(message)
        .select()
        .single();
      if (error) throw error;

      const { error: updateError } = await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", message.conversation_id);

      if (updateError) {
        console.warn("Failed to update conversation timestamp:", updateError.message);
      }

      return data as Message;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: MSG_KEYS.messages(data.conversation_id) });
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      name,
      createdBy,
      participantIds,
    }: {
      type: "direct" | "group" | "broadcast";
      name?: string;
      createdBy: string;
      participantIds: string[];
    }) => {
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({ type, name, created_by: createdBy })
        .select()
        .single();

      if (convError) throw convError;

      const allParticipants = [...new Set([createdBy, ...participantIds])];

      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert(
          allParticipants.map((uid) => ({
            conversation_id: conversation.id,
            user_id: uid,
          }))
        );

      if (partError) throw partError;
      return conversation as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
