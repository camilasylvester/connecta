ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tiktok_open_id text;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tiktok_access_token text;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tiktok_refresh_token text;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tiktok_token_expires_at timestamp with time zone;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tiktok_connected_at timestamp with time zone;
