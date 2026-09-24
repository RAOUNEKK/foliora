/*
# Create book_reviews table

1. New Tables
- `book_reviews` - Stores user-written reviews for favorited books
  - `id` (uuid, primary key)
  - `book_id` (text, not null) - Google Books volume ID
  - `review_text` (text, not null) - The user's written review
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `book_reviews`.
- Allow anon + authenticated CRUD since this is a single-tenant app without auth.
*/

CREATE TABLE IF NOT EXISTS book_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id text NOT NULL,
  review_text text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_book_reviews_book_id ON book_reviews(book_id);

ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_book_reviews" ON book_reviews;
CREATE POLICY "anon_select_book_reviews" ON book_reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_book_reviews" ON book_reviews;
CREATE POLICY "anon_insert_book_reviews" ON book_reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_book_reviews" ON book_reviews;
CREATE POLICY "anon_update_book_reviews" ON book_reviews FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_book_reviews" ON book_reviews;
CREATE POLICY "anon_delete_book_reviews" ON book_reviews FOR DELETE
  TO anon, authenticated USING (true);
