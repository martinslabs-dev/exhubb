API & Frontend Examples

1) Next.js API route (app router) - `GET /api/categories/menu`

Example (file: `src/app/api/categories/menu/route.ts`):

```ts
import { NextResponse } from 'next/server';
import menu from '../../../../taxonomy-migration/categories_menu.json';

export async function GET() {
  // In production, load cached JSON from Redis or a DB and set proper cache headers
  return NextResponse.json(menu, { status: 200 });
}
```

Notes:
- Cache this JSON in memory or Redis; invalidate when categories change.
- Return minimal payload needed for mega-menu.

2) React Mega-menu component (server-render + hydrate)

- Server render menu HTML (fast on hover). On client, hydrate only interactivity.

Example outline:

```tsx
// server component
export default async function MegaMenu() {
  const res = await fetch('/api/categories/menu', { cache: 'force-cache' });
  const json = await res.json();
  return (
    <nav className="mega-menu">
      {json.menu.map(col => (
        <div key={col.slug} className="menu-column">
          <h4>{col.title}</h4>
          {col.columns.map((c) => (
            <div key={c.heading}>
              <h5>{c.heading}</h5>
              {c.items.map(i => <a key={i.slug} href={`/${i.slug}`}>{i.title}</a>)}
            </div>
          ))}
        </div>
      ))}
    </nav>
  );
}
```

3) Admin import endpoint (sketch)

- POST `/api/admin/categories/import` accepts taxonomy JSON, validates, and upserts categories.
- After import, re-generate cached `menu.json` and return a migration preview (counts per leaf)

Security: restrict to admin API keys and run DB operations in transactions.

4) Mapping pipeline integration

- Use `enhanced_index.js` as a CLI step on product export.
- High-confidence mappings (confidence >= 0.75) can be automatically applied; others go into admin review queue with product preview and suggested category.
- Store mapping decisions and reasons for audit (helps refine rules).

If you want, I can:
- Generate a full `categories_inserts.sql` using `generate_sql.js` and save it to the repo.
- Create the Next.js API route file in your codebase (I can patch it into `src/app/api/...`).
- Run the enhanced mapper on a product export you upload.
