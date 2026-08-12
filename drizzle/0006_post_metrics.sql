ALTER TABLE creator_posts
  ADD COLUMN IF NOT EXISTS likes_count integer;

ALTER TABLE creator_posts
  ADD COLUMN IF NOT EXISTS comments_count integer;

ALTER TABLE creator_posts
  ADD COLUMN IF NOT EXISTS views_count integer;
