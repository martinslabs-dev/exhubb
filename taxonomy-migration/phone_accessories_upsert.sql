-- Upsert script to add 'Phones & Tablets' and 'Mobile Accessories' category tree
-- Safe to run on Supabase (Postgres). Uses ON CONFLICT on slug to update existing nodes.
-- Review before running. Run on staging first.

BEGIN;

-- Ensure tables exist (no-op if already created)
CREATE TABLE IF NOT EXISTS attribute_sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  schema JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  depth INT DEFAULT 0,
  attribute_set_id TEXT REFERENCES attribute_sets(id),
  meta JSONB DEFAULT '{}'::jsonb
);

-- Insert / upsert attribute sets
INSERT INTO attribute_sets (id, name, schema) VALUES
('mobile-phones', 'Mobile Phones', '{"attributes":[{"key":"brand"},{"key":"model"},{"key":"storage_gb"},{"key":"ram_gb"},{"key":"condition"},{"key":"network"},{"key":"color"}]}'),
('mobile-accessories', 'Mobile Accessories', '{"attributes":[{"key":"accessory_type"},{"key":"compatible_brands"},{"key":"connector_type"},{"key":"wireless"}]}')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, schema = EXCLUDED.schema;

-- Upsert categories by slug (updates name/parent/depth/attribute_set_id/meta if slug exists)
INSERT INTO categories (id, name, slug, parent_id, depth, attribute_set_id, meta) VALUES
('phones-tablets', 'Phones & Tablets', 'phones-tablets', NULL, 0, NULL, '{}'),
('mobile-phones', 'Mobile Phones', 'mobile-phones', 'phones-tablets', 1, 'mobile-phones', '{}'),
('smartphones', 'Smartphones', 'smartphones', 'mobile-phones', 2, 'mobile-phones', '{}'),
('basic-phones', 'Basic Phones', 'basic-phones', 'mobile-phones', 2, 'mobile-phones', '{}'),
('refurbished-phones', 'Refurbished Phones', 'refurbished-phones', 'mobile-phones', 2, 'mobile-phones', '{}'),
('rugged-phones', 'Rugged Phones', 'rugged-phones', 'mobile-phones', 2, 'mobile-phones', '{}'),
('mobile-accessories', 'Mobile Accessories', 'mobile-accessories', 'phones-tablets', 1, 'mobile-accessories', '{}'),
('chargers-cables', 'Chargers & Cables', 'chargers-cables', 'mobile-accessories', 2, 'mobile-accessories', '{}'),
('batteries-powerbanks', 'Batteries & Power Banks', 'batteries-powerbanks', 'mobile-accessories', 2, 'mobile-accessories', '{}'),
('cases-screen-protectors', 'Cases & Screen Protectors', 'cases-screen-protectors', 'mobile-accessories', 2, 'mobile-accessories', '{}'),
('audio', 'Audio (Earphones & Headsets)', 'audio', 'mobile-accessories', 2, 'mobile-accessories', '{}'),
('memory-cards', 'Memory Cards', 'memory-cards', 'mobile-accessories', 2, 'mobile-accessories', '{}'),
('phone-camera-lenses', 'Phone Camera Lenses', 'phone-camera-lenses', 'mobile-accessories', 2, 'mobile-accessories', '{}'),
('tablets', 'Tablets', 'tablets', 'phones-tablets', 1, NULL, '{}'),
('ipads', 'iPads', 'ipads', 'tablets', 2, NULL, '{}'),
('android-tablets', 'Android Tablets', 'android-tablets', 'tablets', 2, NULL, '{}'),
('educational-tablets', 'Educational Tablets', 'educational-tablets', 'tablets', 2, NULL, '{}')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  depth = EXCLUDED.depth,
  attribute_set_id = EXCLUDED.attribute_set_id,
  meta = EXCLUDED.meta;

COMMIT;

-- How to run:
-- 1) In Supabase Studio -> SQL editor: paste the contents and run in a transaction on staging.
-- 2) Or with psql:
--    PGPASSWORD=<pw> psql "<SUPABASE_DB_URL>" -f taxonomy-migration/phone_accessories_upsert.sql

-- After running: verify new categories exist:
-- SELECT id, name, slug, parent_id, depth, attribute_set_id FROM categories WHERE slug LIKE 'phones%' OR slug LIKE 'mobile-%' ORDER BY depth, name;
