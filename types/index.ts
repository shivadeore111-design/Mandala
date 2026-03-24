export interface Profile { id: string; email: string; username?: string | null; full_name?: string | null; avatar_url?: string | null; created_at?: string; }
export interface Sadhana { id: string; name: string; description?: string | null; morning_duration_min?: number | null; evening_duration_min?: number | null; session_type: 'morning' | 'evening' | 'both'; icon?: string | null; }
export interface Mandala { id: string; user_id: string; sadhana_id: string; start_date: string; end_date: string; day_count: number; target_days: number; session_type: 'morning' | 'evening' | 'both'; status: 'active' | 'completed' | 'paused'; sadhanas?: Sadhana; }
export interface MandalaCheckin { id: string; mandala_id: string; user_id: string; date: string; session: 'morning' | 'evening'; created_at?: string; }
export interface JournalEntry { id: string; user_id: string; title: string; content: string; mood: 'restless' | 'dull' | 'neutral' | 'peaceful' | 'blissful'; energy: number; created_at: string; }
export interface DailyContemplation { id: string; quote: string; reflection?: string | null; date: string; }
export interface SpiritualEvent { id: string; name: string; event_date: string; event_type?: string | null; }
export interface Artwork { id: string; title: string; image_url?: string | null; artist_id: string; artist_username?: string | null; category?: string | null; price?: number | null; is_for_sale?: boolean; }
