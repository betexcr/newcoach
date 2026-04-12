CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#4F46E5',
  secondary_color TEXT DEFAULT '#10B981',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their organization"
  ON organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Org admins can update"
  ON organizations FOR UPDATE
  USING (id IN (SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

INSERT INTO storage.buckets (id, name, public) VALUES ('org-logos', 'org-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Org members can upload logos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'org-logos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view org logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-logos');
