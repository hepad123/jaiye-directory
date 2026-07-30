-- Add location/address columns to vendors for map feature
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS address_country text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS instagram_synced_at timestamptz;

-- Create vendor_photos table if it doesn't exist
CREATE TABLE IF NOT EXISTS vendor_photos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  clerk_user_id text,
  url text NOT NULL,
  caption text,
  source text DEFAULT 'upload',
  created_at timestamptz DEFAULT now()
);

-- If table already existed, just add the source column
ALTER TABLE vendor_photos
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'upload';

-- RLS: allow public reads, deny client writes (admin client bypasses RLS)
ALTER TABLE vendor_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vendor_photos' AND policyname = 'Public read vendor_photos'
  ) THEN
    CREATE POLICY "Public read vendor_photos" ON vendor_photos FOR SELECT USING (true);
  END IF;
END
$$;

-- Index for map queries (find vendors by location)
CREATE INDEX IF NOT EXISTS idx_vendors_lat_lng
  ON vendors (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index for filtering by city/state
CREATE INDEX IF NOT EXISTS idx_vendors_address_city
  ON vendors (address_city)
  WHERE address_city IS NOT NULL;
