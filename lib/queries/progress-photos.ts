import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ProgressPhoto } from "@/types/database";

const PHOTO_KEYS = {
  all: ["progress_photos"] as const,
  byClient: (clientId: string) => [...PHOTO_KEYS.all, clientId] as const,
};

export function useProgressPhotos(clientId: string) {
  return useQuery({
    queryKey: PHOTO_KEYS.byClient(clientId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progress_photos")
        .select("*")
        .eq("client_id", clientId)
        .order("logged_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as ProgressPhoto[];
    },
    enabled: !!clientId,
  });
}

export function useUploadProgressPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      clientId,
      pose,
      loggedDate,
      imageUri,
      mimeType,
    }: {
      clientId: string;
      pose: ProgressPhoto["pose"];
      loggedDate: string;
      imageUri: string;
      mimeType: string;
    }) => {
      const ext = mimeType.split("/")[1] ?? "jpg";
      const fileName = `${clientId}/${Date.now()}_${pose}.${ext}`;

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from("progress-photos")
        .upload(fileName, blob, { contentType: mimeType, upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("progress-photos")
        .getPublicUrl(fileName);

      const photoUrl = urlData.publicUrl;

      const { data, error } = await supabase
        .from("progress_photos")
        .insert({
          client_id: clientId,
          photo_url: photoUrl,
          pose,
          logged_date: loggedDate,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ProgressPhoto;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHOTO_KEYS.all });
    },
  });
}

export function useDeleteProgressPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, photoUrl }: { id: string; photoUrl: string }) => {
      const path = photoUrl.split("/progress-photos/")[1];
      if (path) {
        await supabase.storage.from("progress-photos").remove([path]);
      }
      const { error } = await supabase.from("progress_photos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHOTO_KEYS.all });
    },
  });
}
