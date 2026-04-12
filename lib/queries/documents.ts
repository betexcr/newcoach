import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Document } from "@/types/database";

const DOC_KEYS = {
  all: ["documents"] as const,
  byCoach: (coachId: string) => [...DOC_KEYS.all, "coach", coachId] as const,
  byClient: (clientId: string) => [...DOC_KEYS.all, "client", clientId] as const,
};

export function useDocuments(coachId: string) {
  return useQuery({
    queryKey: DOC_KEYS.byCoach(coachId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!coachId,
  });
}

export function useClientDocuments(clientId: string) {
  return useQuery({
    queryKey: DOC_KEYS.byClient(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!clientId,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      coachId,
      title,
      description,
      fileUri,
      mimeType,
      fileType,
    }: {
      coachId: string;
      title: string;
      description?: string;
      fileUri: string;
      mimeType: string;
      fileType: string;
    }) => {
      const ext = mimeType.split("/")[1] ?? "pdf";
      const fileName = `${coachId}/${Date.now()}_${title.replace(/\s+/g, "_")}.${ext}`;

      const response = await fetch(fileUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, blob, { contentType: mimeType, upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData, error: urlError } = await supabase.storage
        .from("documents")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10);
      if (urlError || !urlData?.signedUrl) throw urlError ?? new Error("Failed to create URL");

      const { data, error } = await supabase
        .from("documents")
        .insert({
          coach_id: coachId,
          title,
          description: description || null,
          file_url: fileName,
          file_type: fileType,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOC_KEYS.all });
    },
  });
}

export async function getDocumentSignedUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, 60 * 60);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fileUrl }: { id: string; fileUrl: string }) => {
      if (fileUrl && !fileUrl.startsWith("http")) {
        await supabase.storage.from("documents").remove([fileUrl]);
      } else {
        const path = fileUrl.split("/documents/")[1];
        if (path) await supabase.storage.from("documents").remove([path]);
      }
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOC_KEYS.all });
    },
  });
}

export function useAssignDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      documentId,
      clientId,
    }: {
      documentId: string;
      clientId: string;
    }) => {
      const { data, error } = await supabase
        .from("documents")
        .update({ client_id: clientId })
        .eq("id", documentId)
        .select()
        .single();
      if (error) throw error;
      return data as Document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOC_KEYS.all });
    },
  });
}
