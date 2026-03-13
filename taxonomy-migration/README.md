Taxonomy Migration Toolkit

What this package provides
- `taxonomy.json` — a hierarchical category tree (top → leaf) with Phones & Tablets expanded.
- `attribute_sets.json` — sample attribute schemas for `mobile-phones` and `mobile-accessories`.
- `index.js` — a simple Node.js script to auto-map products to leaf category slugs using keyword rules.
- `migration.sql` — example Postgres SQL to create `categories` and `attribute_sets` and insert sample rows.
- `sample_products.json` — sample items to test mapping.

Quick start
1. Node mapping (no deps required):

```bash
cd taxonomy-migration
node index.js sample_products.json mapped_products.json
```

2. Inspect `mapped_products.json` for mapped results and confidence scores.

Integration notes
- Use `migration.sql` to create DB tables, then bulk-insert categories using the `taxonomy.json` nodes.
- Extend `attribute_sets.json` to include full attribute schemas; wire `attribute_set_id` into `categories`.
- Replace `index.js` rule engine with a more robust classifier (ML or heuristics) for production.

Next steps I can take for you
- Run a repo-wide scan to export existing product titles and sample counts for automatic mapping.
- Generate a full SQL insert file converting `taxonomy.json` into `INSERT` statements for all categories.
- Integrate mapping script into your import pipeline or admin UI.

Tell me which to do next.