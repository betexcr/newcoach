-- Run this in the Supabase SQL Editor.
-- It fixes the conversation RLS circular dependency and seeds a coach-client chat.

-- 1. Fix RLS: let conversation creators view their own conversations
CREATE POLICY IF NOT EXISTS "Conversation creators can view own conversations"
  ON conversations FOR SELECT USING (auth.uid() = created_by);

-- 2. Seed conversation between coach and client
DO $$
DECLARE
  v_coach_id UUID;
  v_client_id UUID;
  v_convo_id UUID := gen_random_uuid();
BEGIN
  SELECT id INTO v_coach_id FROM profiles WHERE email = 'coach@demo.newcoach.test';
  SELECT id INTO v_client_id FROM profiles WHERE email = 'client@demo.newcoach.test';

  IF v_coach_id IS NULL OR v_client_id IS NULL THEN
    RAISE EXCEPTION 'Coach or client profile not found — run the Node seed script first.';
  END IF;

  INSERT INTO conversations (id, type, name, created_by)
  VALUES (v_convo_id, 'direct', NULL, v_coach_id);

  INSERT INTO conversation_participants (conversation_id, user_id) VALUES
    (v_convo_id, v_coach_id),
    (v_convo_id, v_client_id);

  INSERT INTO messages (conversation_id, sender_id, body, created_at) VALUES
    (v_convo_id, v_coach_id,  'Hey Jordan! Welcome aboard. I''ve set up your first few weeks of programming. Let me know if you have any questions!', '2026-02-16 10:00:00+00'),
    (v_convo_id, v_client_id, 'Thanks Alex! Super excited to get started. The workouts look great.', '2026-02-16 13:00:00+00'),
    (v_convo_id, v_coach_id,  'Perfect! Remember to log your sets after each workout so I can track your progress.', '2026-02-16 16:00:00+00'),
    (v_convo_id, v_client_id, 'Will do! Quick question — should I be going to failure on the last set?', '2026-02-16 19:00:00+00'),
    (v_convo_id, v_coach_id,  'For now, keep 1-2 reps in reserve (RPE 7-8). We''ll push closer to failure as the program progresses.', '2026-02-16 22:00:00+00'),
    (v_convo_id, v_client_id, 'Got it, thanks!', '2026-02-17 01:00:00+00'),
    (v_convo_id, v_coach_id,  'Great session yesterday! Your squat numbers are looking solid. Keep it up!', '2026-02-17 04:00:00+00'),
    (v_convo_id, v_client_id, 'Thanks! Felt really good. Ready for today''s pull day.', '2026-02-17 07:00:00+00');

  RAISE NOTICE 'Conversation seeded with 8 messages.';
END $$;
