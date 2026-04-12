ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';

CREATE POLICY "Public profiles are readable by anyone"
  ON profiles FOR SELECT
  USING (public_slug IS NOT NULL);
