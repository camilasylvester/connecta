-- Account approval status for brand / creator signups
DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_status account_status NOT NULL DEFAULT 'approved';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reviewed_by text;

ALTER TABLE profiles ALTER COLUMN account_status SET DEFAULT 'pending';

UPDATE profiles SET account_status = 'approved' WHERE role = 'admin';
