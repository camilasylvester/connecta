ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_version text;
