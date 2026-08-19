ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS creator_meta jsonb;
