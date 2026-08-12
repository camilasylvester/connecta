ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tiktok_followers integer;

DO $$ BEGIN
  CREATE TYPE post_platform AS ENUM ('instagram', 'tiktok', 'youtube');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS creator_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url text NOT NULL,
  platform post_platform NOT NULL,
  thumb_url text,
  caption text,
  brand_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creator_posts_creator_id_idx ON creator_posts (creator_id);
