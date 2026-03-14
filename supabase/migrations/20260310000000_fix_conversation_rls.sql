-- Fix circular RLS dependency: conversation creators need to SELECT their
-- own conversations in order to add participants, but the existing SELECT
-- policy requires being a participant (which doesn't exist yet).
CREATE POLICY "Conversation creators can view own conversations"
  ON conversations FOR SELECT USING (auth.uid() = created_by);
