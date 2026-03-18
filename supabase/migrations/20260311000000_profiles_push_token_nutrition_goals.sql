ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nutrition_goals JSONB
  DEFAULT '{"calories":2200,"protein":160,"carbs":250,"fat":70}';
