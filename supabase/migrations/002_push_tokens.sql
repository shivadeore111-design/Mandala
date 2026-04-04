-- Add push_token to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add last_checkin_at to mandalas
ALTER TABLE mandalas ADD COLUMN IF NOT EXISTS last_checkin_at TIMESTAMPTZ;

-- increment_streak: idempotent per day, maintains current_streak and longest_streak
CREATE OR REPLACE FUNCTION increment_streak(p_mandala_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_last TIMESTAMPTZ;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT last_checkin_at INTO v_last FROM mandalas WHERE id = p_mandala_id;

  IF v_last IS NULL OR v_last::DATE < v_today THEN
    UPDATE mandalas SET
      current_streak = CASE
        WHEN v_last IS NULL OR v_last::DATE < v_today - INTERVAL '1 day' THEN 1
        ELSE current_streak + 1
      END,
      longest_streak = GREATEST(
        COALESCE(longest_streak, 0),
        CASE
          WHEN v_last IS NULL OR v_last::DATE < v_today - INTERVAL '1 day' THEN 1
          ELSE current_streak + 1
        END
      ),
      last_checkin_at = NOW()
    WHERE id = p_mandala_id;
  END IF;
END;
$$;
