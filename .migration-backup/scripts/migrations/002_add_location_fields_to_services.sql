-- Add location/address columns to services (same as vendors)
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text,
  ADD COLUMN IF NOT EXISTS address_country text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS instagram_synced_at timestamptz;

-- Index for map queries
CREATE INDEX IF NOT EXISTS idx_services_lat_lng
  ON services (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index for filtering by city
CREATE INDEX IF NOT EXISTS idx_services_address_city
  ON services (address_city)
  WHERE address_city IS NOT NULL;
