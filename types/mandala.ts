export type MandalaStatus = 'active' | 'completed' | 'broken' | 'paused';

export type Mandala = {
  id: string;
  user_id: string;
  practice_name: string;
  practice_type: string;
  target_days: number;
  start_date: string;
  expected_end_date: string;
  status: MandalaStatus;
  completed_days: number;
  current_streak: number;
};
