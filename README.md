# FUSD Foundation — Winter Food Drive

A simple public page: donors pick an item, buy it on Walmart, ship it to our
warehouse, and tap to add it to the running tally. Hosted free on GitHub Pages;
the live counts live in a small Supabase table.

## Live preview (no setup)
Open `index.html` in a browser, or run a tiny local server:

```bash
cd winter-food-drive
python3 -m http.server 8000
# visit http://localhost:8000
```

Until Supabase is configured, counts are stored only in your own browser
(preview mode) — enough to click through and judge the design.

## One-time setup

### 1. Fill in the content (`app.js`, top of file)
- `CONFIG.SHIP_ADDRESS` — the real warehouse address, one line per entry.
- `CONFIG.CONTACT_EMAIL` — reply-to email.
- `ITEMS` — each item's `name`, `goal`, direct `walmart` product URL, and `image`
  filename (drop photos in `/img`). The `id` must stay stable.

### 2. Supabase (holds the shared counts)
1. Create a free project at supabase.com (keep it separate from other projects).
2. SQL Editor → run `schema.sql`, then `seed.sql` (paste the real Walmart URLs in).
3. Project Settings → API → copy the **Project URL** and the **anon public** key.
4. Paste both into `CONFIG.SUPABASE_URL` and `CONFIG.SUPABASE_ANON_KEY` in `app.js`.

The anon key is meant to be public. Visitors can only read the list and call a
bounded "add to tally" function — they cannot set arbitrary numbers.

### 3. Deploy to GitHub Pages
```bash
git add -A && git commit -m "Winter Food Drive page"
git push
```
In the repo on GitHub: **Settings → Pages → Source: main / root**. The page goes
live at `https://<your-username>.github.io/<repo-name>/`.

## Day-to-day

- **Fix a count** (someone over/under-reported): Supabase → Table editor → `items`
  → edit the `pledged` cell. The page reflects it on next load.
- **Change a goal, name, or Walmart link**: edit it in `app.js` (and the `items`
  table if you want the DB to match), commit, push.
- **Add an item**: add a row to `ITEMS` in `app.js` and insert a matching row in
  the `items` table (same `id`).

## How tracking works (plain truth)
Counts are **donor self-reported** — they move when a donor taps "Add to tally."
Nobody can detect a Walmart purchase or a shipment automatically, so this reflects
what donors say they ordered, not what has physically arrived. Correct any number
anytime in the Supabase table editor.
