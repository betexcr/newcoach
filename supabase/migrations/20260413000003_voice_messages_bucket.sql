INSERT INTO storage.buckets (id, name, public) VALUES ('voice-messages', 'voice-messages', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload voice messages"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'voice-messages'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Authenticated users can read voice messages"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voice-messages' AND auth.role() = 'authenticated');
