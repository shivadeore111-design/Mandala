export type SubscriptionTier = 'free' | 'seeker' | 'guide';
export type MandalaStatus = 'active' | 'completed' | 'broken' | 'paused';
export type SessionType = 'morning' | 'evening' | 'both';

export interface Sadhana {
  id: string; name: string; slug: string; description: string; benefits: string;
  duration_minutes_morning: number; duration_minutes_evening: number;
  allows_morning: boolean; allows_evening: boolean;
  recommended_time: string; icon: string; sort_order: number;
}

export interface Mandala {
  id: string; user_id: string; sadhana_id: string;
  practice_name: string; practice_type: string;
  session_type: SessionType; mandala_days: number; target_days: number;
  start_date: string; expected_end_date: string;
  status: MandalaStatus; completed_days: number; current_streak: number;
  is_public: boolean; sadhana?: Sadhana;
}

export interface Profile {
  id: string; username: string; full_name: string; bio: string; avatar_url: string;
  practices: string[]; tradition: string; experience_level: string;
  total_mandalas_completed: number; total_practice_days: number;
  current_streak: number; longest_streak: number;
  subscription_tier: SubscriptionTier;
  brahma_muhurta_alarm: boolean; brahma_muhurta_time: string; created_at: string;
}

export interface MandalaCheckin {
  id: string; mandala_id: string; user_id: string;
  checkin_date: string; day_number: number; session: 'morning' | 'evening';
  duration_minutes: number; quality_rating: number; notes: string;
}

export interface JournalEntry {
  id: string; user_id: string; title: string; content: string;
  entry_type: string; prompt_text: string; mood: string; energy_level: number;
  tags: string[]; is_private: boolean; created_at: string;
}

export interface DailyContemplation {
  id: string; contemplation_date: string; quote: string;
  reflection: string; journal_prompt: string; theme: string;
}

export interface SpiritualEvent {
  id: string; title: string; description: string;
  event_type: string; event_date: string;
  recommended_practices: string[]; significance: string;
}

export interface Artwork {
  id: string; user_id: string; title: string; description: string;
  image_url: string; thumbnail_url: string; art_type: string;
  tags: string[]; is_for_sale: boolean; price_inr: number;
  like_count: number; view_count: number; created_at: string; profile?: Profile;
}
