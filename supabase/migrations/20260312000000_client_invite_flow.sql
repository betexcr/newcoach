-- Allow clients to update their own coach_clients rows (accept/decline invites)
CREATE POLICY "Clients can update their own relationships"
  ON coach_clients FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Allow clients to delete their own coach_clients rows (decline invite)
CREATE POLICY "Clients can delete their own relationships"
  ON coach_clients FOR DELETE
  USING (auth.uid() = client_id);
