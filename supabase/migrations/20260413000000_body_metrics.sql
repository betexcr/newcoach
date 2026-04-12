-- Body metrics tracking table
CREATE TABLE IF NOT EXISTS body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight NUMERIC,
  body_fat NUMERIC,
  chest NUMERIC,
  waist NUMERIC,
  hips NUMERIC,
  biceps NUMERIC,
  thighs NUMERIC,
  logged_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, logged_date)
);

CREATE INDEX idx_body_metrics_client ON body_metrics(client_id, logged_date DESC);

ALTER TABLE body_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage their own body metrics"
  ON body_metrics FOR ALL USING (auth.uid() = client_id);

CREATE POLICY "Coaches can view their clients body metrics"
  ON body_metrics FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
        AND coach_clients.client_id = body_metrics.client_id
        AND coach_clients.status = 'active'
    )
  );
