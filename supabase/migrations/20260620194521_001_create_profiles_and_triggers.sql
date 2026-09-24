/*
# Foliora Social Platform — Core Schema Part 1: Profiles, Triggers, Friend Codes

1. New Tables
- `profiles` — extends auth.users with username, display_name, bio, avatar_url
- `friend_codes` — unique friend codes for invitation-based following

2. Security
- RLS enabled on both tables
- Public read for profiles, owner-only write
- Public read for friend codes, owner-only write

3. Triggers
- Auto-create profile + friend code when user signs up via auth.users trigger
- Auto-update updated_at on profile changes
*/

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  bio text DEFAULT '',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- FRIEND CODES TABLE
CREATE TABLE IF NOT EXISTS friend_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE friend_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friend_codes_select_public" ON friend_codes;
CREATE POLICY "friend_codes_select_public" ON friend_codes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "friend_codes_insert_own" ON friend_codes;
CREATE POLICY "friend_codes_insert_own" ON friend_codes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "friend_codes_delete_own" ON friend_codes;
CREATE POLICY "friend_codes_delete_own" ON friend_codes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_friend_codes_code ON friend_codes(code);
CREATE INDEX IF NOT EXISTS idx_friend_codes_user ON friend_codes(user_id);

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_friend_code()
RETURNS text AS $$
DECLARE
  code text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i integer;
  exists_check boolean;
BEGIN
  LOOP
    code := 'FOL-';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM friend_codes WHERE friend_codes.code = code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username text;
  username_exists boolean;
BEGIN
  new_username := split_part(NEW.email, '@', 1);
  SELECT EXISTS(SELECT 1 FROM profiles WHERE profiles.username = new_username) INTO username_exists;
  IF username_exists THEN
    new_username := new_username || '_' || substr(md5(random()::text), 1, 4);
  END IF;

  INSERT INTO profiles (id, username, display_name, bio, avatar_url)
  VALUES (NEW.id, new_username, split_part(NEW.email, '@', 1), '', NULL);

  INSERT INTO friend_codes (user_id, code)
  VALUES (NEW.id, generate_friend_code());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- PROFILE UPDATED_AT TRIGGER
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_updated_at') THEN
    CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
