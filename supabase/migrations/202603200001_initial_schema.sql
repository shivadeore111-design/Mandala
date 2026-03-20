CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  spiritual_journey_start DATE,
  practices TEXT[] DEFAULT '{}',
  tradition TEXT DEFAULT '',
  experience_level TEXT DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
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
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'seeker', 'guide')),
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
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'broken', 'paused')),
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
  mood_before TEXT CHECK (mood_before IN ('restless', 'dull', 'neutral', 'calm', 'blissful')),
  mood_after TEXT CHECK (mood_after IN ('restless', 'dull', 'neutral', 'calm', 'blissful')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mandala_id, checkin_date)
);

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT '',
  content TEXT NOT NULL,
  entry_type TEXT DEFAULT 'free' CHECK (entry_type IN ('free', 'prompted', 'reflection', 'gratitude', 'contemplation')),
  prompt_text TEXT DEFAULT '',
  mood TEXT CHECK (mood IN ('restless', 'anxious', 'dull', 'neutral', 'peaceful', 'joyful', 'blissful', 'grateful')),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT '{}',
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE spiritual_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT DEFAULT '',
  event_type TEXT NOT NULL CHECK (event_type IN (
    'pournami', 'amavasya', 'ekadashi', 'solstice', 'equinox',
    'festival', 'guru_purnima', 'mahashivratri', 'yoga_day',
    'pradosham', 'sankranti', 'custom'
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

CREATE INDEX idx_mandalas_user_id ON mandalas(user_id);
CREATE INDEX idx_mandala_checkins_mandala_id ON mandala_checkins(mandala_id);
CREATE INDEX idx_mandala_checkins_date ON mandala_checkins(checkin_date);
CREATE INDEX idx_journal_entries_user ON journal_entries(user_id);
CREATE INDEX idx_spiritual_events_date ON spiritual_events(event_date);
CREATE INDEX idx_profiles_location ON profiles USING GIST (ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326));

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandalas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandala_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own mandalas" ON mandalas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public mandalas are viewable" ON mandalas FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage own checkins" ON mandala_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access own journal" ON journal_entries FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_mandala_on_checkin()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE mandalas
  SET
    completed_days = completed_days + 1,
    current_streak = completed_days + 1,
    updated_at = NOW(),
    status = CASE
      WHEN completed_days + 1 >= target_days THEN 'completed'
      ELSE 'active'
    END,
    actual_end_date = CASE
      WHEN completed_days + 1 >= target_days THEN NEW.checkin_date
      ELSE NULL
    END
  WHERE id = NEW.mandala_id;

  UPDATE profiles
  SET
    total_practice_days = total_practice_days + 1,
    current_streak = current_streak + 1,
    longest_streak = GREATEST(longest_streak, current_streak + 1),
    updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_mandala_checkin
  AFTER INSERT ON mandala_checkins
  FOR EACH ROW EXECUTE FUNCTION update_mandala_on_checkin();
