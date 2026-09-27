-- Ficha de marca: web, resumen y fotos.
-- No toca creadores. Las columnas nuevas quedan vacías hasta confirmar cada marca.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS gallery_urls jsonb DEFAULT '[]'::jsonb;
