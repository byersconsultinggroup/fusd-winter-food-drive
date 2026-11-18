-- FUSD Foundation — Winter Food Drive: seed the 5 items.
-- Run AFTER schema.sql. Paste the real Walmart URLs in the walmart_url column.
-- Re-running is safe: it updates name/goal/url but leaves pledged counts alone.

insert into items (id, name, goal, walmart_url, image_file, sort) values
  ('cup-noodles',   'Nissin Cup Noodles, Chicken — 24-count',              328, '', 'cup-noodles.jpg',   1),
  ('oatmeal',       'Quaker Instant Oatmeal Variety Pack — 52 packets',    302, '', 'oatmeal.jpg',       2),
  ('crackers',      'Lance ToastChee Peanut Butter Crackers — pack of 40', 194, '', 'crackers.jpg',      3),
  ('chewy-bars',    'Quaker Chewy Bars Variety Pack — 60 ct',              131, '', 'chewy-bars.jpg',    4),
  ('fruity-snacks', 'Holiday Fruity Snacks Variety Pack — 100 count',       77, '', 'fruity-snacks.jpg', 5)
on conflict (id) do update
  set name = excluded.name,
      goal = excluded.goal,
      walmart_url = excluded.walmart_url,
      image_file = excluded.image_file,
      sort = excluded.sort;
