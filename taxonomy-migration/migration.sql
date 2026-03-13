-- SQL migration to create categories and attribute_sets tables (Postgres example)

BEGIN;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  depth INT DEFAULT 0,
  attribute_set_id TEXT,
  meta JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS attribute_sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  schema JSONB NOT NULL
);

-- Sample inserts for Phones & Tablets subtree (ids match taxonomy.json)
INSERT INTO categories (id, name, slug, parent_id, depth) VALUES
('phones-tablets','Phones & Tablets','phones-tablets', NULL, 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, slug, parent_id, depth) VALUES
('mobile-phones','Mobile Phones','mobile-phones','phones-tablets',1),
('smartphones','Smartphones','smartphones','mobile-phones',2),
('basic-phones','Basic Phones','basic-phones','mobile-phones',2),
('refurbished-phones','Refurbished Phones','refurbished-phones','mobile-phones',2),
('rugged-phones','Rugged Phones','rugged-phones','mobile-phones',2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, slug, parent_id, depth) VALUES
('mobile-accessories','Mobile Accessories','mobile-accessories','phones-tablets',1),
('chargers-cables','Chargers & Cables','chargers-cables','mobile-accessories',2),
('batteries-powerbanks','Batteries & Power Banks','batteries-powerbanks','mobile-accessories',2),
('cases-screen-protectors','Cases & Screen Protectors','cases-screen-protectors','mobile-accessories',2),
('audio','Audio (Earphones & Headsets)','audio','mobile-accessories',2),
('memory-cards','Memory Cards','memory-cards','mobile-accessories',2)
ON CONFLICT (id) DO NOTHING;

-- Sample attribute_sets
INSERT INTO attribute_sets (id, name, schema) VALUES
('mobile-phones','Mobile Phones', '{"attributes":[{"key":"brand"},{"key":"model"}]}')
ON CONFLICT (id) DO NOTHING;

COMMIT;
