-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('coach', 'client')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Coach-Client relationships
CREATE TABLE IF NOT EXISTS coach_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, client_id)
);

ALTER TABLE coach_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage their client relationships"
  ON coach_clients FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Clients can view their coach relationships"
  ON coach_clients FOR SELECT USING (auth.uid() = client_id);

-- Any authenticated user can read profiles (needed for Add Client email lookup)
CREATE POLICY "Authenticated users can read basic profiles"
  ON profiles FOR SELECT USING (auth.role() = 'authenticated');

-- Exercises library
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  muscle_group TEXT NOT NULL,
  equipment TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read non-custom exercises"
  ON exercises FOR SELECT USING (is_custom = FALSE);

CREATE POLICY "Coaches can read own custom exercises"
  ON exercises FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Coaches can create exercises"
  ON exercises FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Coaches can update own exercises"
  ON exercises FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Coaches can delete own exercises"
  ON exercises FOR DELETE USING (auth.uid() = created_by);

-- Workout templates
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own templates"
  ON workout_templates FOR ALL USING (auth.uid() = coach_id);

CREATE TRIGGER workout_templates_updated_at
  BEFORE UPDATE ON workout_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Programs
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own programs"
  ON programs FOR ALL USING (auth.uid() = coach_id);

CREATE TRIGGER programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Program workouts (individual days within a program)
CREATE TABLE IF NOT EXISTS program_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'
);

ALTER TABLE program_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage program workouts"
  ON program_workouts FOR ALL USING (
    EXISTS (
      SELECT 1 FROM programs WHERE programs.id = program_workouts.program_id AND programs.coach_id = auth.uid()
    )
  );

-- Assigned workouts
CREATE TABLE IF NOT EXISTS assigned_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'partial')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE assigned_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage assigned workouts"
  ON assigned_workouts FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Clients can view their assigned workouts"
  ON assigned_workouts FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clients can update their workout status"
  ON assigned_workouts FOR UPDATE USING (auth.uid() = client_id);

-- Workout results
CREATE TABLE IF NOT EXISTS workout_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_workout_id UUID NOT NULL REFERENCES assigned_workouts(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logged_sets JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workout_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage own results"
  ON workout_results FOR ALL USING (auth.uid() = client_id);

CREATE POLICY "Coaches can view client results"
  ON workout_results FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
        AND coach_clients.client_id = workout_results.client_id
        AND coach_clients.status = 'active'
    )
  );

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group', 'broadcast')),
  name TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
        AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their participations"
  ON conversation_participants FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Conversation creators can add participants"
  ON conversation_participants FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_participants.conversation_id
        AND conversations.created_by = auth.uid()
    )
  );

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT,
  voice_url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read messages"
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- Habits
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage habits"
  ON habits FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Clients can view their habits"
  ON habits FOR SELECT USING (auth.uid() = client_id);

-- Habit logs
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(habit_id, logged_date)
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage own habit logs"
  ON habit_logs FOR ALL USING (
    EXISTS (
      SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.client_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can view habit logs"
  ON habit_logs FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.coach_id = auth.uid()
    )
  );

-- Nutrition tracking
CREATE TABLE nutrition_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  meal text NOT NULL DEFAULT 'snack',
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage own nutrition logs"
  ON nutrition_logs FOR ALL
  USING (auth.uid() = client_id);

-- Indexes for common queries
CREATE INDEX idx_coach_clients_coach ON coach_clients(coach_id);
CREATE INDEX idx_coach_clients_client ON coach_clients(client_id);
CREATE INDEX idx_assigned_workouts_client_date ON assigned_workouts(client_id, scheduled_date);
CREATE INDEX idx_assigned_workouts_coach ON assigned_workouts(coach_id);
CREATE INDEX idx_workout_results_client ON workout_results(client_id);
CREATE INDEX idx_workout_results_workout ON workout_results(assigned_workout_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX idx_habits_client ON habits(client_id);
CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id, logged_date);
CREATE INDEX idx_nutrition_logs_client_date ON nutrition_logs(client_id, logged_date);
