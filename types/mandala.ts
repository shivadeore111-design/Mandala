export type MandalaStatus = 'active' | 'completed' | 'broken' | 'paused';

export type MandalaMood = 'restless' | 'dull' | 'neutral' | 'calm' | 'blissful';

export type MandalaCheckin = {
  id: string;
  mandala_id: string;
  user_id: string;
  checkin_date: string;
  day_number: number;
  duration_minutes: number;
  quality_rating: number | null;
  notes: string | null;
  mood_before: MandalaMood | null;
  mood_after: MandalaMood | null;
  created_at: string;
};

export type Mandala = {
  id: string;
  user_id: string;
  practice_name: string;
  practice_type: string;
  practice_description: string;
  practice_duration_minutes: number;
  target_days: number;
  start_date: string;
  expected_end_date: string;
  actual_end_date: string | null;
  status: MandalaStatus;
  completed_days: number;
  current_streak: number;
  broken_at: string | null;
  broken_reason: string;
  reminder_enabled: boolean;
  reminder_time: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  mandala_checkins?: MandalaCheckin[];
};

export type CreateMandalaParams = {
  practice_name: string;
  practice_type: string;
  practice_description?: string;
  practice_duration_minutes?: number;
  target_days: number;
  reminder_enabled: boolean;
  reminder_time: string;
  is_public: boolean;
};

export type CheckInParams = {
  mandalaId: string;
  duration_minutes: number;
  quality_rating: number;
  mood_before: MandalaMood;
  mood_after: MandalaMood;
  notes?: string;
};
