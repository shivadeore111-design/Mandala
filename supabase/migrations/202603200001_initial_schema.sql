-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. TABLES

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  spiritual_journey_start DATE,
  practices TEXT[] DEFAULT '{}',
  tradition TEXT DEFAULT '',
  experience_level TEXT DEFAULT 'beginner' CHECK (experience_level IN ('beginner','intermediate','advanced')),
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_city TEXT DEFAULT '',
  location_country TEXT DEFAULT '',
  location_visible BOOLEAN DEFAULT true,
  total_mandalas_completed INTEGER DEFAULT 0,
  total_practice_days INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_journal_entries INTEGER DEFAULT 0,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free','seeker','guide')),
  subscription_expires_at TIMESTAMPTZ,
  badges TEXT[] DEFAULT '{}',
  brahma_muhurta_alarm BOOLEAN DEFAULT false,
  brahma_muhurta_time TIME DEFAULT '05:00:00',
  notification_daily_reminder BOOLEAN DEFAULT true,
  notification_community BOOLEAN DEFAULT true,
  notification_calendar BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mandalas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  practice_name TEXT NOT NULL,
  practice_type TEXT NOT NULL,
  practice_description TEXT DEFAULT '',
  practice_duration_minutes INTEGER DEFAULT 0,
  target_days INTEGER DEFAULT 40,
  start_date DATE NOT NULL,
  expected_end_date DATE NOT NULL,
  actual_end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','broken','paused')),
  completed_days INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  broken_at DATE,
  broken_reason TEXT DEFAULT '',
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '06:00:00',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mandala_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mandala_id UUID NOT NULL REFERENCES mandalas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  day_number INTEGER NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  notes TEXT DEFAULT '',
  mood_before TEXT CHECK (mood_before IN ('restless','dull','neutral','calm','blissful')),
  mood_after TEXT CHECK (mood_after IN ('restless','dull','neutral','calm','blissful')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mandala_id, checkin_date)
);

CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_image_url TEXT DEFAULT '',
  circle_type TEXT NOT NULL CHECK (circle_type IN ('local','topic','challenge','private')),
  topic_category TEXT DEFAULT '',
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  location_city TEXT DEFAULT '',
  location_radius_km INTEGER DEFAULT 50,
  created_by UUID NOT NULL REFERENCES profiles(id),
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member','moderator','admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text','milestone','question','reflection','satsang_invite')),
  milestone_type TEXT,
  milestone_data JSONB DEFAULT '{}',
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id),
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT DEFAULT '',
  challenge_type TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_deadline DATE,
  daily_requirement TEXT NOT NULL,
  checkin_verification TEXT DEFAULT 'self_report',
  created_by UUID NOT NULL REFERENCES profiles(id),
  participant_count INTEGER DEFAULT 0,
  active_participant_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','dropped')),
  current_streak INTEGER DEFAULT 0,
  total_checkins INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE challenge_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  notes TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id, checkin_date)
);

CREATE TABLE spiritual_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT DEFAULT '',
  event_type TEXT NOT NULL CHECK (event_type IN (
    'pournami','amavasya','ekadashi','solstice','equinox',
    'festival','guru_purnima','mahashivratri','yoga_day',
    'pradosham','sankranti','custom'
  )),
  event_date DATE NOT NULL,
  event_time TIME,
  recommended_practices TEXT[] DEFAULT '{}',
  significance TEXT DEFAULT '',
  notify_before_hours INTEGER DEFAULT 24,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT '',
  content TEXT NOT NULL,
  entry_type TEXT DEFAULT 'free' CHECK (entry_type IN ('free','prompted','reflection','gratitude','contemplation')),
  prompt_text TEXT DEFAULT '',
  mood TEXT CHECK (mood IN ('restless','anxious','dull','neutral','peaceful','joyful','blissful','grateful')),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT '{}',
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_contemplations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contemplation_date DATE UNIQUE NOT NULL,
  quote TEXT NOT NULL,
  reflection TEXT NOT NULL,
  journal_prompt TEXT NOT NULL,
  practice_suggestion TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  audio_duration_seconds INTEGER DEFAULT 0,
  theme TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE satsang_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  host_id UUID NOT NULL REFERENCES profiles(id),
  circle_id UUID REFERENCES circles(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('in_person','online','hybrid')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location_name TEXT DEFAULT '',
  location_address TEXT DEFAULT '',
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  meeting_link TEXT DEFAULT '',
  max_participants INTEGER DEFAULT 0,
  current_participants INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  price_inr INTEGER DEFAULT 0,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE satsang_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  satsang_id UUID NOT NULL REFERENCES satsang_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered','attended','cancelled')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(satsang_id, user_id)
);

CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES

CREATE INDEX idx_mandalas_user_id ON mandalas(user_id);
CREATE INDEX idx_mandalas_status ON mandalas(status);
CREATE INDEX idx_mandala_checkins_mandala_id ON mandala_checkins(mandala_id);
CREATE INDEX idx_mandala_checkins_date ON mandala_checkins(checkin_date);
CREATE INDEX idx_posts_circle_id ON posts(circle_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_circle_members_user ON circle_members(user_id);
CREATE INDEX idx_circle_members_circle ON circle_members(circle_id);
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX idx_journal_entries_user ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(created_at DESC);
CREATE INDEX idx_spiritual_events_date ON spiritual_events(event_date);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_profiles_location ON profiles USING GIST (
  ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326)
);
CREATE INDEX idx_satsang_events_time ON satsang_events(start_time);

-- 4. RLS

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandalas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandala_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email,'@',1), new.id::text),
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    NOW(), NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles
CREATE POLICY "Profiles viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users delete own profile" ON profiles FOR DELETE USING (auth.uid() = id);

-- Mandalas
CREATE POLICY "Users manage own mandalas" ON mandalas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public mandalas viewable" ON mandalas FOR SELECT USING (is_public = true);

-- Checkins: DB-level ownership guard
CREATE OR REPLACE FUNCTION validate_checkin_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM mandalas WHERE id = NEW.mandala_id AND user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Mandala does not belong to user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_checkin_ownership
  BEFORE INSERT ON mandala_checkins
  FOR EACH ROW EXECUTE FUNCTION validate_checkin_ownership();

CREATE POLICY "Users manage own checkins" ON mandala_checkins
  FOR ALL USING (
    auth.uid() = user_id
    AND mandala_id IN (SELECT id FROM mandalas WHERE user_id = auth.uid())
  );

-- Journal
CREATE POLICY "Users access own journal" ON journal_entries FOR ALL USING (auth.uid() = user_id);

-- Posts
CREATE POLICY "Posts viewable by everyone" ON posts FOR SELECT USING (is_hidden = false);
CREATE POLICY "Users manage own posts" ON posts FOR ALL USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users see own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- 5. FUNCTIONS & TRIGGERS

-- Check-in trigger (streak off-by-one fixed)
CREATE OR REPLACE FUNCTION update_mandala_on_checkin()
RETURNS TRIGGER AS $$
DECLARE
  v_new_completed_days INTEGER;
  v_mandala mandalas%ROWTYPE;
BEGIN
  SELECT * INTO v_mandala FROM mandalas WHERE id = NEW.mandala_id;
  v_new_completed_days := v_mandala.completed_days + 1;

  UPDATE mandalas SET
    completed_days = v_new_completed_days,
    current_streak = v_new_completed_days,
    updated_at = NOW(),
    status = CASE WHEN v_new_completed_days >= target_days THEN 'completed' ELSE 'active' END,
    actual_end_date = CASE WHEN v_new_completed_days >= target_days THEN NEW.checkin_date ELSE NULL END
  WHERE id = NEW.mandala_id;

  UPDATE profiles SET
    total_practice_days = total_practice_days + 1,
    current_streak = CASE
      WHEN (SELECT COUNT(*) FROM mandalas WHERE user_id = NEW.user_id AND status = 'active') > 1
      THEN (SELECT MAX(current_streak) FROM mandalas WHERE user_id = NEW.user_id AND status = 'active')
      ELSE v_new_completed_days
    END,
    longest_streak = GREATEST(longest_streak, v_new_completed_days),
    updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_mandala_checkin
  AFTER INSERT ON mandala_checkins
  FOR EACH ROW EXECUTE FUNCTION update_mandala_on_checkin();

-- Daily cron: mark broken mandalas
CREATE OR REPLACE FUNCTION check_broken_mandalas()
RETURNS void AS $$
BEGIN
  UPDATE mandalas SET
    status = 'broken', broken_at = CURRENT_DATE, updated_at = NOW()
  WHERE
    status = 'active'
    AND start_date < CURRENT_DATE
    AND id NOT IN (
      SELECT DISTINCT mandala_id FROM mandala_checkins
      WHERE checkin_date = CURRENT_DATE - INTERVAL '1 day'
    );

  UPDATE profiles p SET current_streak = 0, updated_at = NOW()
  FROM mandalas m
  WHERE m.user_id = p.id AND m.status = 'broken' AND m.broken_at = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Mandala completion: increment profile counter
CREATE OR REPLACE FUNCTION on_mandala_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status = 'active' THEN
    UPDATE profiles SET
      total_mandalas_completed = total_mandalas_completed + 1,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_mandala_status_change
  AFTER UPDATE OF status ON mandalas
  FOR EACH ROW EXECUTE FUNCTION on_mandala_complete();

-- Nearby seekers (PostGIS)
CREATE OR REPLACE FUNCTION find_nearby_seekers(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km INTEGER DEFAULT 25,
  max_results INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID, username TEXT, full_name TEXT, avatar_url TEXT,
  total_mandalas_completed INTEGER, current_streak INTEGER,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.username, p.full_name, p.avatar_url,
    p.total_mandalas_completed, p.current_streak,
    (ST_DistanceSphere(
      ST_MakePoint(p.location_lng, p.location_lat),
      ST_MakePoint(user_lng, user_lat)
    ) / 1000)::DOUBLE PRECISION AS distance_km
  FROM profiles p
  WHERE p.location_visible = true
    AND p.location_lat IS NOT NULL
    AND p.location_lng IS NOT NULL
    AND ST_DistanceSphere(
      ST_MakePoint(p.location_lng, p.location_lat),
      ST_MakePoint(user_lng, user_lat)
    ) <= radius_km * 1000
  ORDER BY distance_km
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- 6. SEED DATA

INSERT INTO spiritual_events (title, description, event_type, event_date, recommended_practices, significance) VALUES
('Pournami (Full Moon)', 'Full moon — heightened energy. Ideal for intense meditation.', 'pournami', '2025-07-10', ARRAY['meditation','chanting','fasting'], 'Sadhana done on Pournami is said to be many times more effective.'),
('Amavasya (New Moon)', 'New moon — ideal for introspection and ancestor remembrance.', 'amavasya', '2025-06-25', ARRAY['introspection','silent_sitting'], 'A time for turning inward.'),
('Guru Purnima', 'Honor the Guru principle.', 'guru_purnima', '2025-07-10', ARRAY['gratitude_practice','extended_meditation','seva'], 'The principle that takes you from darkness to light.'),
('Mahashivratri', 'The Great Night of Shiva.', 'mahashivratri', '2025-02-26', ARRAY['all_night_meditation','chanting','fasting'], 'Staying awake and aware can be deeply transformative.'),
('International Yoga Day', 'Global celebration of yoga.', 'yoga_day', '2025-06-21', ARRAY['surya_kriya','yoga_asanas','pranayama'], 'Deepen your practice and share the gift of yoga.'),
('Dakshinayana', 'Sun begins southward journey. Sadhana season begins.', 'solstice', '2025-07-16', ARRAY['meditation','spiritual_reading'], 'The most conducive 6-month period for spiritual growth.');

INSERT INTO badges (id, name, description, icon_url, criteria_type, criteria_value, rarity) VALUES
('first_checkin', 'First Step', 'Completed your first check-in', '🌱', 'checkin_count', 1, 'common'),
('streak_7', 'Week Warrior', '7-day unbroken streak', '⚡', 'streak_days', 7, 'common'),
('streak_21', 'Habit Former', '21-day unbroken streak', '🔥', 'streak_days', 21, 'rare'),
('streak_40', 'Mandala Keeper', '40-day complete mandala', '🔱', 'streak_days', 40, 'epic'),
('mandala_1', 'First Mandala', 'Completed your first mandala', '🏆', 'mandala_count', 1, 'rare'),
('mandala_3', 'Devoted Practitioner', '3 mandalas completed', '💎', 'mandala_count', 3, 'epic'),
('mandala_7', 'Sadhana Master', '7 mandalas completed', '👑', 'mandala_count', 7, 'legendary'),
('early_riser', 'Brahma Muhurta', 'Checked in before 6 AM for 21 days', '🌅', 'early_checkins', 21, 'rare'),
('circle_creator', 'Circle Starter', 'Created your first seeker circle', '🔵', 'circles_created', 1, 'common'),
('community_voice', 'Community Voice', '50 posts or comments', '📣', 'post_count', 50, 'rare'),
('journal_keeper', 'Inner Explorer', '30 journal entries written', '📖', 'journal_count', 30, 'rare'),
('challenge_complete', 'Challenge Champion', 'Completed a community challenge', '🎯', 'challenges_completed', 1, 'common');

INSERT INTO daily_contemplations (contemplation_date, quote, reflection, journal_prompt, practice_suggestion, theme) VALUES
('2025-06-01', 'Are you living, or are you just managing to survive?',
'Most people go through life handling one situation after another. They call this living. But living means experiencing life in full depth — not just the surface, but the very core of existence.',
'Write about one moment in the past week where you felt truly alive — not productive, not successful, but ALIVE.',
'Sit quietly 5 minutes. With each breath, feel the life energy keeping your heart beating without effort.',
'awareness'),
('2025-06-02', 'Your body is the only thing absolutely with you from birth to death. Have you paid attention to it?',
'We carry this miraculous body a lifetime yet most of us know our phone better than our own body.',
'Scan your body head to toe. Write what you notice — tension, warmth, numbness. Where does your body speak to you?',
'Body scan: 10 minutes, head to toe, just observe, change nothing.',
'body');
